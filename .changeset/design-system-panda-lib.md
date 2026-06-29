---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
'@pandacss/cli': minor
---

Add `panda lib` to publish a design system. It scans your library source, writes `panda.lib.json`, a portable `panda.buildinfo.json`, and a compiled `preset.mjs`, then syncs your `package.json` exports. The command is idempotent and supports `--watch`.

On the consumer side, a `designSystem` now gives you a version drift receipt between runs, warns when a token is defined by both the library and your config (your value wins), and falls back to re-extracting the library's `files` when its build info is stale instead of failing the build.
