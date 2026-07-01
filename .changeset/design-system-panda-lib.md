---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
'@pandacss/cli': minor
---

Add `panda lib` to package a Panda design system.

It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
package exports. It can also run in watch mode.

Consumers also get token conflict warnings when the app and design system define the same token path; the app value
wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.
