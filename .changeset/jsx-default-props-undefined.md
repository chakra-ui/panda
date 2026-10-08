---
'@pandacss/compiler': patch
---

Fix passing an explicit `undefined` prop (like `size={undefined}`) overriding a value from `defaultProps` or
`PropsProvider` in the JSX factory and recipe contexts. It now keeps the default, like React's `defaultProps`.
