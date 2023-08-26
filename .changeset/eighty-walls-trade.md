---
'@pandacss/generator': patch
'@pandacss/dev': patch
---

Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type definition
files. This is useful for projects that use `moduleResolution: node16` which requires explicit file extensions in
imports/exports.

> If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
> `.d.mts`.
