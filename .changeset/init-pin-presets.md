---
'@pandacss/cli': patch
---

Pin the presets `panda init` installs to the CLI's own version. An unpinned install resolved the `latest` tag, so a v2
prerelease project got v1 presets.
