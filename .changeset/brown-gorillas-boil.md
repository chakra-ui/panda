---
'@pandacss/is-valid-prop': patch
'@pandacss/generator': patch
'@pandacss/shared': patch
'@pandacss/studio': patch
'@pandacss/types': patch
---

Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and further
reduce it.

`config.jsxStyleProps`:

- When set to 'all', all style props are allowed.
- When set to 'minimal', only the `css` prop is allowed.
- When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
  - `<styled.div />` and `styled("div")` aren't valid
  - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`
