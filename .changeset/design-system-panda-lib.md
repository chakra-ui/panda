---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
'@pandacss/cli': minor
---

Add `panda lib` to publish a design system in one command. It scans your library source, then writes `panda.lib.json`, a portable `panda.buildinfo.json`, and a compiled `preset.mjs`, and syncs your `package.json` exports. It's idempotent and takes `--watch`.

Adopting a `designSystem` does more on your side too. You get a version drift receipt between runs. You get a warning when a token is defined by both the library and your config — your value wins. And when a library's build info is stale, Panda re-extracts its `files` instead of failing your build.
