---
'@pandacss/preset-base': minor
'@pandacss/compiler': patch
---

Add `scrollbarThumb` and `scrollbarTrack` so you can color each side of `scrollbar-color`. `scrollbarGutter` accepts `stable both-edges`.

```ts
css({
  overflow: 'auto',
  scrollbarWidth: 'thin',
  scrollbarThumb: 'gray.400',
  scrollbarTrack: 'gray.100',
  scrollbarGutter: 'stable',
})
```

**Breaking:** `scrollbarWidth` takes `auto`, `thin`, or `none` instead of `sizes` tokens, since `scrollbar-width` never accepted a length. Swap a size token for `thin` or `none`. `scrollbarColor` is now a raw two-value string (`red transparent`). A single color token never produced valid CSS there, since `scrollbar-color` takes exactly two, so move it to `scrollbarThumb`.
