// @ts-nocheck
// import unixfs from helia and memory blockstore
import { IDBBlockstore } from 'https://esm.sh/blockstore-idb@2.0.3'
import { unixfs } from 'https://esm.sh/@helia/unixfs@5.0.3'
import { CID } from 'https://esm.sh/multiformats@13.3.7/cid'

const blockstore = new IDBBlockstore('store-path')
const fs = unixfs({ blockstore })

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

async function ensureContentIsLoaded() {
  const cid = CID.parse('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')
  await blockstore.open()

  // if (blockstore.has(cid)) {
  //   console.log('CID already in blockstore')
  //   return
  // }

  const response = await fetch('https://trustless-gateway.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi?format=raw', {
    headers: {
      Accept: 'application/vnd.ipld.raw',
    },
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }

  // Convert ArrayBuffer to Uint8Array
  const arrayBuffer = await response.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Add raw bytes to blockstore directly
  await blockstore.put(cid, uint8Array)
  console.log('CID added to blockstore:', cid)
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.pathname === '/') {
    // don't handle the root path
    return
  }
  const cid = CID.parse('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')
  if (url.pathname.endsWith('/test-ready')) {
    console.log('Test ready endpoint hit')
    event.respondWith(new Response('ready', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    }))
    return
  }

  if (url.pathname.endsWith('/unregister')) {
    console.log('Unregistering SW')
    event.waitUntil(self.registration.unregister())
    return
  }

  if (url.pathname.endsWith('/image-sw-blob')) {
    console.log('Fetching image-sw')

    // Create a promise that will resolve with the response
    const responsePromise = (async () => {
      try {
        await ensureContentIsLoaded()

        const chunks = []
        for await (const chunk of await fs.cat(cid)) {
          chunks.push(chunk)
        }

        return new Response(new Blob(chunks), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'x-cid': cid.toString(),
          }
        })
      } catch (error) {
        console.error('Error:', error)
        return new Response('Error: ' + error.message, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    })()

    // Respond with the promise
    event.respondWith(responsePromise)
    return
  }

  if (url.pathname.endsWith('/image-sw-stream')) {
    console.log('Fetching image-sw')

    // Create a promise that will resolve with the response
    const responsePromise = (async () => {
      try {
        await ensureContentIsLoaded()

        const chunks = []
        for await (const chunk of await fs.cat(cid)) {
          chunks.push(chunk)
        }

        const stream = new ReadableStream({
          async start(controller) {
            for await (const chunk of chunks) {
              controller.enqueue(chunk)
            }
            controller.close()
          }
        })

        return new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'x-cid': cid.toString(),
          }
        })
      } catch (error) {
        console.error('Error:', error)
        return new Response('Error: ' + error.message, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    })()

    // Respond with the promise
    event.respondWith(responsePromise)
    return
  }

})
