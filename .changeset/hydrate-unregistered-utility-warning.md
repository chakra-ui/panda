---
'@pandacss/compiler': patch
---

Warn when a `designSystem` consumer replays a library atom whose utility isn't registered in its own config, usually because the library's preset wasn't merged. The style used to emit silently as the kebab-cased utility name (`boxSize` became `box-size`). Now `panda cssgen`/`codegen` reports it, naming the design system and the utility, so you can add the missing preset.
