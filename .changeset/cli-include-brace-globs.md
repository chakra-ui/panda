---
'@pandacss/cli': patch
---

`--include` now accepts brace globs, and repeating the flag scans every glob. Commas are part of the glob, not
separators.

```sh
# brace globs work
panda cssgen --include "src/**/*.{ts,tsx}"

# repeat the flag for more than one glob
panda cssgen --include "src/**/*.tsx" --include "app/**/*.tsx"
```

If you used a comma-separated list, repeat the flag instead (same for `panda lib --files`):

```diff
- panda cssgen --include "src/**/*.tsx,app/**/*.tsx"
+ panda cssgen --include "src/**/*.tsx" --include "app/**/*.tsx"
```
