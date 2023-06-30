---
'@pandacss/shared': patch
---

Fix the `astish` shared function when using `config.syntax: 'template-literal'`

ex: css`${someVar}`

if a value is unresolvable in the static analysis step, it would be interpreted as `undefined`, and `astish` would
throw:

> TypeError: Cannot read properties of undefined (reading 'replace')
