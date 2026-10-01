---
'@pandacss/compiler': patch
---

Fix nested conditions applying in the wrong order. Hovering a button now recolors its icon again:

```ts
css({ _hover: { _icon: { color: 'red' } } })
// before: .x :where(svg):hover  (only when the icon itself is hovered)
// after:  .x:hover :where(svg)
```
