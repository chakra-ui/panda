---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/studio': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add a `imports:created` hook where you can configure additional aliases for the `css` or `styled` factory functions.

They must mirror the same function signature as the default functions and still need to contain static arguments.

```ts
// panda.config.ts
configure({
  matchers: {
    css: ['xcss'], // match `xcss` as a `css` fn
    jsxFactory: ['xstyled'], // match `xstyled` as a `styled` fn
  },
})
```

```ts
// file.tsx
const className = xcss({ color: 'red' })
// this will be extracted just like the default `css` function

const className = xstyled('div', { base: { color: 'red' } })
// this will be extracted just like the default `styled` function

// or if using the template-literal syntax
const className = xcss`color: red;`
const className2 = xstyled.div`color: red;`
```
