---
'@pandacss/studio': patch
---

Fix `panda studio --build` producing an empty site (and a 404) when studio's dependencies can't be resolved from the output directory, which is common with pnpm. Build errors now also fail the command instead of being logged and ignored.
