# Safari Service Worker Bug Repro

## 🧪 What this shows

It shows that the bug on inbrowser.link is not related to Safari, because it works in Safari with this repo.

## 📦 How to test

Visit https://sgtpooki.github.io/safari-sw-bug-repro/

Click the links to see the different ways to serve the image.

You can also go to https://sgtpooki.github.io/safari-sw-bug-repro/image-sw-stream, which will first load HTML (prior to sw activation), and then the page will reload and the image will be served from the SW.


## Local testing

Run `npx http-server -p 8998 .` and visit http://localhost:8998/ in Safari.
