---
'@pandacss/core': patch
---

Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

```ts
css({
  '@container (min-width: token(sizes.xl))': {
    color: 'green.300',
  },
  '@media (min-width: token(sizes.2xl))': {
    color: 'red.300',
  },
})
```
