---
'@pandacss/webpack': patch
---

Fix `transform: true` under Rspack failing with `Can't resolve '@pandacss-internal/css'`. The plugin now applies the
transformer's Rspack adapter when the compiler is Rspack.
