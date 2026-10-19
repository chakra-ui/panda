---
'@pandacss/types': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Add `jsxMatchTag` to choose which JSX components Panda reads style props from. Match by name or import path; the last
matching rule wins.

```ts
export default defineConfig({
  jsxMatchTag: [
    { from: '@tanstack/react-table', ignore: true },
    { tag: /Button$/, props: ['color'] },
  ],
})
```
