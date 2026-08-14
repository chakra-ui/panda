---
'@pandacss/compiler': patch
---

Fix the `{colors.x/alpha}` opacity modifier being ignored outside the `colors` category. In `shadows`, `borders` and
`gradients` it passed through as raw `colors.x/alpha` text, which browsers drop. It now expands to `color-mix(...)`
everywhere.

Fix the composite object form of a `semanticTokens` value emitting nothing. It was parsed as a conditions map named
after its own keys. Applies to composite `shadow`, `border` and `asset` values.

```ts
semanticTokens: {
  shadows: {
    card: { value: { offsetX: '0', offsetY: '2px', blur: '4px', spread: '0', color: '{colors.ink}' } },
  },
}
```

Fix composite `gradients` emitting bare numbers where CSS needs a unit. A stop `position` now serializes as a percentage
(`100%`, was `100px`) and a numeric `placement` as an angle (`45deg`, was `45`, which browsers rejected outright).
Gradients using either form will render differently.
