---
'@pandacss/generator': patch
---

Fix issue where specifying `defaultProps.children` in the `styled` or `createStyleContext` factories makes it impossible
to override children.

The fix ensures that explicitly passed children take precedence over default children in React, Preact, and Qwik JSX
factories.
