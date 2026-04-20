---
'@pandacss/extractor': patch
'@pandacss/parser': patch
---

Recognize React automatic-runtime JSX calls (`jsx`, `jsxs`, `jsxDEV`) as component
instances so Panda can extract styles from already-compiled files.

`<Box css={{ color: 'red' }} />` compiles down to `jsx(Box, { css: { color: 'red' } })`
via the React automatic JSX runtime. The extractor now treats that call as a synthetic
JSX element, which is what lets Panda scan pre-compiled `dist` bundles shipped by
component libraries and still produce CSS for inline object literals on the `css` prop.

Closes #3509.
