---
'@pandacss/core': patch
---

Fix condition order when combining mixed conditions (array format) with nested selectors.

When using conditions like `hover: ['&:hover']` with nested selectors like `'& > :where(svg)'`, the CSS selector order was incorrect:

```js
// Before (broken):
// .class > :where(svg):hover - hover applied to svg child

// After (fixed):
// .class:hover > :where(svg) - hover applied to parent element
```

The fix ensures that:
- At-rules are always placed first (for proper CSS wrapping)
- Selector conditions preserve their source order (matching what you write)

This affects users who define conditions using the array format and combine them with arbitrary/nested selectors.
