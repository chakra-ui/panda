---
'@pandacss/token-dictionary': patch
'@pandacss/parser': patch
'@pandacss/core': patch
---

Add support for token references with curly braces like `{path.to.token}` in media queries, just like the
`token(path.to.token)` alternative already could.

```ts
css({
  // ✅ this is fine now, will resolve to something like
  // `@container (min-width: 56em)`
  '@container (min-width: {sizes.4xl})': {
    color: 'green',
  },
})
```

Fix an issue where the curly token references would not be escaped if the token path was not found.
