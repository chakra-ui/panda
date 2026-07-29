---
'@pandacss/compiler': patch
---

Fix conditional spreads dropping static styles they don't override.
`css({ padding: '2', margin: '3', ...(b ? { padding: '1' } : { margin: '4' }) })` lost `margin: '3'` and `padding: '2'`
from their respective branches instead of keeping them.
