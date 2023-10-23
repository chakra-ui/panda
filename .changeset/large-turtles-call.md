---
'@pandacss/node': patch
---

Fix issue where FileSystem writes cause intermittent errors in different build contexts (Vercel, Docker). This was
solved by limiting the concurrency using the `p-limit` library
