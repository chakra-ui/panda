---
'@pandacss/config': patch
'@pandacss/compiler': patch
---

Stop `panda lib` from writing unpublishable peer ranges into `panda.lib.json`. A `catalog:` or `workspace:*` `@pandacss/dev` range now falls back to the running Panda's major instead of being stamped verbatim. Pass `--panda <range>` to set one explicitly.
