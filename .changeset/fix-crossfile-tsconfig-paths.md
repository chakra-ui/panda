---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fold values imported through a tsconfig `paths` alias (e.g. `import { brand } from '@tokens'`), matching relative
imports. Previously these aliases were skipped during cross-file resolution, so aliased tokens and styles were dropped
from the output.

This also removes a build-time slowdown that grew quadratically with file count: unresolved aliases piled into a retry
that re-ran on every file. Large monorepos that alias cross-package imports will see `cssgen` scale linearly again.
