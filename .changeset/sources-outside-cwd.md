---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix dev and watch mode ignoring edits and new files matched by an `include` glob outside the project root, such as a
sibling package in a monorepo:

```ts
include: ['./src/**/*.tsx', '../../packages/ui/src/**/*.tsx']
```
