---
'@pandacss/config': patch
---

Clearer diagnostics when a `designSystem` fails to load. A malformed `panda.lib.json` now reports a parse error (not "failed to read") with a diagnostic code, a preset that throws on import gets a coded `design_system_preset_load_failed` diagnostic, and a package that's installed but doesn't expose `./panda.lib.json` is told to rebuild with `panda lib` instead of "install it".
