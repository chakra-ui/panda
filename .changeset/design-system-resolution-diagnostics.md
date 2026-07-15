---
'@pandacss/config': patch
---

Clearer, safer `designSystem` resolution. A malformed `panda.lib.json` now reports a parse error (not "failed to read") with a diagnostic code, a preset that throws on import gets a coded `design_system_preset_load_failed`, and a package that's installed but doesn't expose `./panda.lib.json` is told to rebuild with `panda lib` instead of "install it". A `workspace:`/`catalog:` protocol specifier is rejected with guidance instead of a cryptic Node error, and a chain where two different packages share a name now fails clearly instead of silently overwriting one package's styles.
