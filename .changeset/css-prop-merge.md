---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Merge the `css` prop over the style props beside it, so one declaration wins instead of two classes whose winner
depended on stylesheet order. Shorthands normalize first, so `padding` and `p` collide the way they do at runtime.

```tsx
// before: className="color_blue color_red", renders red
// after:  className="color_blue", renders blue
<Box color="red" css={{ color: 'blue' }} />
```

Generated CSS can shrink: a rule whose only source was the losing side of a collision is no longer emitted.
