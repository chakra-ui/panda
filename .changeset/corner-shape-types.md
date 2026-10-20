---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Add newer CSS properties to the generated types: `cornerShape` (and per-corner variants), `readingFlow`, `readingOrder`,
`interestDelay`, `interactivity`, `scrollMarkerGroup`, `scrollTargetGroup`, `caretAnimation`, `dynamicRangeLimit`,
`baselineSource` and `textDecorationInset`.

```ts
css({ borderRadius: '50%', cornerShape: 'squircle' })
```
