---
'@pandacss/config': patch
'@pandacss/node': patch
---

Fix an edge-case for when the `config.outdir` would not be set in the `panda.config`

Internal details: The `outdir` would not have any value after a config change due to the fallback being set in the
initial config resolving code path but not in context reloading code path, moving it inside the config loading function
fixes this issue.
