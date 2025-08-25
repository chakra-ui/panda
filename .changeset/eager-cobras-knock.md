---
'@pandacss/preset-base': minor
---

Add new utilities for managing focus rings with `focusRing` and `focusVisibleRing` properties

- `focusRing`: Style focus states using `&:is(:focus, [data-focus])` selector with `outside`, `inside`, `mixed`, or
  `none` values
- `focusVisibleRing`: Style keyboard-only focus using `&:is(:focus-visible, [data-focus-visible])` selector
- `focusRingColor`, `focusRingWidth`, `focusRingStyle`, and `focusRingOffset` for fine-tuned control
- Configure the global focus ring color with `--global-color-focus-ring` in global CSS

```tsx
<div
  className={css({
    focusRing: 'outside',
    focusVisibleRing: 'inside',
    focusRingColor: 'blue.300',
  })}
>
  Click me
</div>
```
