---
'@pandacss/core': patch
'@pandacss/extractor': patch
'@pandacss/parser': patch
---

Fix cases where Stitches `styled.withConfig` would be misinterpreted as a panda fn and lead to this error:

```ts
TypeError: Cannot read properties of undefined (reading 'startsWith')
    at /panda/packages/shared/dist/index.js:433:16
    at get (/panda/packages/shared/dist/index.js:116:20)
    at Utility.setClassName (/panda/packages/core/dist/index.js:1682:66)
    at inner (/panda/packages/core/dist/index.js:1705:14)
    at Utility.getOrCreateClassName (/panda/packages/core/dist/index.js:1709:12)
    at AtomicRule.transform (/panda/packages/core/dist/index.js:1729:23)
    at /panda/packages/core/dist/index.js:323:32
    at inner (/panda/packages/shared/dist/index.js:219:12)
    at walkObject (/panda/packages/shared/dist/index.js:221:10)
    at AtomicRule.process (/panda/packages/core/dist/index.js:317:35)
```
