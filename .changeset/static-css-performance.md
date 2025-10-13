---
'@pandacss/core': patch
'@pandacss/config': patch
---

Improve static CSS generation performance with wildcard memoization. Token lookups for wildcard (`*`) expansions are now
cached, providing ~32% faster processing for large configs with wildcards.
