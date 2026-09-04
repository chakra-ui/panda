---
'@pandacss/bun': minor
---

Add `@pandacss/bun`, a Bun plugin that codegens, injects CSS into the layer file, and optionally rewrites sources with
`transform: true`. The default export is a ready-made plugin for `Bun.build` and `bunfig.toml` (`[serve.static]`);
`pandacss(options)` builds a configured one, and `await register()` from a preload file covers `bun run` and `bun test`.
In Bun's dev server, edited modules hot-reload together with their new styles.
