---
'@pandacss/parser': patch
---

Fix parsing of factory recipe with property access + object syntax, such as:

```ts
const Input = styled.input({
  base: {
    color: 'blue.100',
    bg: 'blue.900',
  },
})
```
