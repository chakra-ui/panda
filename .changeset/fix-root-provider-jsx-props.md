---
"@pandacss/generator": patch
---

Fix type issue where `withRootProvider` from style context incorrectly allowed JSX style props to be passed through to the root component. The root provider now correctly accepts only component props, unstyled prop, and recipe variant props, excluding JSX style props.