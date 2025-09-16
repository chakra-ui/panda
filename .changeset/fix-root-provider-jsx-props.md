---
'@pandacss/generator': patch
---

- **Style Context**: Fix type issue where `withRootProvider` from style context incorrectly allowed JSX style props to
  be passed through to the root component.

- **React**: Fix issue where combining wrapping a style context component with `styled` caused `ref` to be incorrectly
  typed
