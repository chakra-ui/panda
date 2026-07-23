---
'@pandacss/cli': minor
---

`panda init --no-install` is now `--skip-presets`. Same idea: scaffold a bare config without adding the default preset
packages. Programmatic callers use `skipPresets` instead of `install: false`.

```bash
panda init --skip-presets
```
