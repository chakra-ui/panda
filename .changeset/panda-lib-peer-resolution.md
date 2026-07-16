---
'@pandacss/config': patch
'@pandacss/compiler': patch
---

Resolve `workspace:`/`catalog:`/`npm:` peer protocols when `panda lib` writes a manifest, so a design system built in a pnpm workspace ships a hydratable `panda` range instead of the raw protocol. `workspace:^2.0.0` keeps its range and `npm:@pandacss/dev@^2` resolves to its aliased range; bare `workspace:*` / `catalog:` fall back to the installed Panda version. You no longer need `--panda` to work around it.
