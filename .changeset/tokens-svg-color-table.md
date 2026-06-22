---
'@pandacss/compiler': patch
---

Complete the SVG asset color-name shortening table (full parity with v1's 55 named colors) and fix a hex substring-match bug where values like `#fff000` were incorrectly shortened to `white000`.
