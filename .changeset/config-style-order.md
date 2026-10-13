---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix recipe variants emitting in alphabetical order. They follow your config again, so a later variant overrides an
earlier one:

```ts
variants: {
  visual: { solid: { padding: '1px' } },
  size: { sm: { padding: '4px' } }, // `size` wins, as declared
}
```

Slots, compound variants, `variantKeys`, and `variantMap` keep config order too.
