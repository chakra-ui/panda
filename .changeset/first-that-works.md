---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/dev': minor
'@pandacss/types': minor
---

Add `firstThatWorks()` for ordered CSS value fallbacks, so one property can carry a modern value and a supported one:

```ts
import { css, firstThatWorks } from 'styled-system/css'

css({ color: firstThatWorks('oklch(55% 0.18 250)', '#0057b8') })
```

```css
.c_firstThatWorks\(oklch\(55\%_0\.18_250\)\,_\#0057b8\) {
  color: #0057b8;
  color: oklch(55% 0.18 250);
}
```

Write the value you want first, as in StyleX. Members are typed by the property they sit in, so they autocomplete and
`strictTokens` still applies. Config recipes import `firstThatWorks` from `@pandacss/dev`, or write the
`firstThatWorks(a, b)` value form directly.
