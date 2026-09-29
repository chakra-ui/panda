---
'@pandacss/shared': patch
'@pandacss/generator': patch
---

Improve runtime performance of JSX style props. Checking whether a prop is a style prop no longer goes through a cache
that serialized its arguments on every call, so rendering styled components is faster. `memo` also skips
`JSON.stringify` for single-string arguments.
