---
'@pandacss/core': patch
---

- Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints

```jsx
css({ hideBelow: 'lg' })
// => @media screen and (max-width: 63.9975em) { background: red; }
```

- Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

```jsx
css({ hideFrom: '800px' })
// => @media screen and (min-width: 800px) { background: red; }
```
