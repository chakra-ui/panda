---
'@pandacss/shared': patch
---

Improve algorithm for deterministic property order.

- Longhand (`padding`, `margin`, `inset`)
- Shorthand of longhands (`padding-inline`, `margin-inline`)
- Shorthand of shorthands (`padding-inline-start`, `margin-inline-start`)

```tsx
css({
  p: '4',
  pr: '2',
  px: '10',
})
```

Will result in the following css regardless of the order of the properties:

```css
.p-4 {
  padding: 4px;
}

.px-10 {
  padding-left: 10px;
  padding-right: 10px;
}

.pr-2 {
  padding-right: 2px;
}
```
