---
'@pandacss/astro-plugin-studio': major
'@pandacss/dev': major
'@pandacss/cli': major
'@pandacss/compiler': major
'@pandacss/compiler-shared': major
'@pandacss/compiler-wasm': major
'@pandacss/config': major
'@pandacss/config-loader': major
'@pandacss/core': major
'@pandacss/extractor': major
'@pandacss/generator': major
'@pandacss/is-valid-prop': major
'@pandacss/logger': major
'@pandacss/mcp': major
'@pandacss/node': major
'@pandacss/parser': major
'@pandacss/plugin-lightningcss': major
'@pandacss/plugin-svelte': major
'@pandacss/plugin-vue': major
'@pandacss/postcss': major
'@pandacss/preset-atlaskit': major
'@pandacss/preset-base': major
'@pandacss/preset-open-props': major
'@pandacss/preset-panda': major
'@pandacss/reporter': major
'@pandacss/shared': major
'@pandacss/studio': major
'@pandacss/token-dictionary': major
'@pandacss/types': major
'@pandacss/vite': major
---

Panda v2 packages are now ESM-only.

- all packages declare `"type": "module"` and ship a single ESM build (no more CJS `dist/*.js` + ESM `dist/*.mjs` pairs)
- `exports` maps no longer have a `require` condition; `main` and `module` fields are removed
- Node.js `>= 22.12.0` is required; CJS consumers (e.g. `postcss.config.cjs`, Next.js webpack configs) keep working through Node's built-in `require(esm)`
- `require('@pandacss/postcss')` and `require('@pandacss/dev/postcss')` return the plugin function directly (via Node's `module.exports` named export)
- `update-notifier` and `kleur` are now regular dependencies of `@pandacss/dev` instead of being bundled
- `panda.config.ts` files and generated `styled-system` output are unaffected
