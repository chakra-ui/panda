---
'@pandacss/extractor': patch
---

Fix issue (https://github.com/chakra-ui/panda/issues/1365) with the `unbox` fn that removed nullish values, which could
be useful for the [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax)

```ts
const className = css({
  color: ['black', undefined, 'orange', 'red'],
})
```
