---
'@pandacss/compiler': patch
---

Fix two shadow token bugs that produced invalid CSS or no output.

A `{colors.x/alpha}` opacity modifier inside a `shadows` value (or any non-color category, like `borders` and `gradients`) now expands to `color-mix(...)` instead of emitting the raw `colors.x/alpha` text, which the browser dropped.

The composite `Shadow` object form in `semanticTokens` now works:

```ts
semanticTokens: {
  shadows: {
    card: { value: { offsetX: '0', offsetY: '2px', blur: '4px', spread: '0', color: '{colors.ink}' } },
  },
}
```

It used to be read as conditions and emit nothing. The same fix covers composite `border`, `gradient`, and `asset` semantic tokens.
