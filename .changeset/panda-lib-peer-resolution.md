---
'@pandacss/config': patch
---

`panda lib` now resolves an `npm:` peer alias (`npm:@pandacss/dev@^3.0.0`) to its aliased range when writing the manifest, alongside the existing `workspace:`/`catalog:` handling, so an aliased dependency still produces a hydratable `panda` range.
