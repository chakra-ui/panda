---
'@pandacss/cli': patch
'@pandacss/compiler': minor
'@pandacss/compiler-shared': minor
'@pandacss/compiler-wasm': minor
---

Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and triggers extra
reloads/rebuilds for no-op codegen and CSS writes.

The compiler write APIs now use object params consistently:

- `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
- `writeCss({ outfile, cwd, emitLayerDeclaration })`
- `writeSplitCss({ outdir, cwd })`
