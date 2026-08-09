---
'@pandacss/compiler': patch
---

Speed up `css()` when styles arrive through a wrapper chain. Each level rebuilds its array of styles every render, so
the memo used to re-serialize the whole tree on every call. It now keys those calls on the identity of the style objects
inside, which don't change.

```tsx
const L1 = ({ css: cssProp }) => <L0 css={[l1, cssProp]} />
```

Renders roughly 4x faster for a three-level chain, 3x for six levels. Plain `css({ … })` calls are unaffected.
