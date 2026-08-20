---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/dev': minor
'@pandacss/types': minor
---

Add ordered CSS value fallbacks, so one property can carry a modern value and a supported one:

```ts
css({ color: css.fallback('oklch(55% 0.18 250)', '#0057b8') })
```

```css
.c_fallback\(oklch\(55\%_0\.18_250\)\,_\#0057b8\) {
  color: #0057b8;
  color: oklch(55% 0.18 250);
}
```

Values are written most-preferred first, like `var(--brand, red)`. Members are typed by the property they sit in, so
they autocomplete and `strictTokens` still applies. Config recipes use `cssFallback()` from `@pandacss/dev`, or write
the `fallback(a, b)` value form directly.
