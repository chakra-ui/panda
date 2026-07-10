# Platform support

How the Rust-core transformer plugs into each host.

## Summary

Rust owns transform semantics. `@pandacss/transformer` is the JS facade. Each bundler adapter maps that contract to its
own module resolution, watch, and source-transform APIs.

Transformed source imports the internal runtime module:

```ts
import { cx as __pcx } from '@pandacss-internal/css'
```

Inline recipe rewrites may also need `cva as __pcva` or `sva as __psva` from the same module. Hosts resolve
`@pandacss-internal/css` to an internal ID and return bundled runtime source from `@pandacss/transformer`.

## Support matrix

| Host      | Transform hook shape                  | Internal module shape        | Watch / invalidation model             | Status                          |
| --------- | ------------------------------------- | ---------------------------- | -------------------------------------- | ------------------------------- |
| Vite      | plugin `transform`                    | virtual module               | dev server module graph + file watcher | shipped (`@pandacss/vite`)      |
| Rollup    | plugin `transform`                    | virtual module               | plugin `watchChange` + emitted asset   | shipped (`@pandacss/rollup`)    |
| Rolldown  | runs the Rollup plugin unchanged      | virtual module               | plugin `watchChange`                   | validated via the Rollup plugin |
| webpack   | `pre` loader + orchestration plugin   | virtual module (unplugin)    | loader dependencies + `watchRun`       | shipped (`@pandacss/webpack`)   |
| Rspack    | webpack-compatible loader/plugin path | synthetic module or aliased  | loader dependencies + compiler watch   | planned via webpack shape       |
| Turbopack | `turbopack.rules` loader (JS only)    | data URL (no virtual module) | loader dependencies                    | blocked on CSS aggregation      |

## Shared host contract

Every host adapter does the same five things:

1. Select transformable source modules.
2. Call `@pandacss/transformer` with source text and file path.
3. Return rewritten code plus source map.
4. Resolve `@pandacss-internal/css`.
5. Register watch dependencies for extra files the transform reports.

Rust owns semantics. The JS facade owns binding shape. The host adapter owns only host APIs.

## Vite

### Status

`@pandacss/vite` already calls `createPandaSourcePluginHooks` from `@pandacss/transformer` in `transform`, `resolveId`,
and `load`. CSS-root handling and HMR stay in the Vite package.

### Adapter shape

1. `transform` — run source transform via shared hooks
2. `resolveId` — intercept `@pandacss-internal/css`
3. `load` — return bundled internal runtime (separator patched from project config)
4. Keep helper invalidation stateless
5. Compiler comes from the Panda driver created in `configResolved`

Resolved internal ID today:

```txt
\0pandacss:internal:css
```

Mapping:

- source import: `@pandacss-internal/css`
- resolved internal ID: `\0pandacss:internal:css`

### Watch behavior

The internal runtime has no dynamic state. Transformed source files still need Panda watch behavior: source files,
config, and future cross-file transform dependencies.

## Rollup

`@pandacss/rollup` ships. It reuses Vite's virtual-module model (`resolveId` / `load` / `transform`) through
`@pandacss/transformer`'s `rollup` unplugin, plus a small orchestration plugin:

- `pandaTransformer.rollup()` handles the transform and the `@pandacss-internal/css` module.
- `buildStart` runs codegen + `parseFiles`; `watchChange` folds edits in incrementally.
- `generateBundle` emits the stylesheet as a Rollup asset. Rollup has no CSS pipeline, so the plugin owns delivery.

Verified: `css()` / `token()` / patterns / recipes inline, the runtime module bundles cleanly, source maps chain back to
the original source, and watch rebuilds emit fresh CSS.

## Rolldown

The Rollup plugin runs under Rolldown unchanged — no `@pandacss/rolldown` package. Rolldown targets Rollup-plugin
compatibility, so the same `resolveId` / `load` / `transform` / `emitFile` / `generateBundle` surface just works.
Rolldown compiles TS/JSX itself (OXC), so the config drops esbuild and node-resolve.

The shipping rule is met, verified on the unmodified Rollup plugin:

- helper resolution — `@pandacss-internal/css` bundles, no dangling import
- source maps — v3, mapping to the original pre-transform source
- watch rebuilds — a style edit rebuilds and re-emits CSS (~20ms)

Scope: standalone Rollup and Rolldown, plus `tsdown` (the Rolldown library bundler). Rolldown-powered Vite runs Vite
plugins, so it stays with `@pandacss/vite`, not this.

Rolldown maintains `string_wizard`, which Panda uses in `pandacss_project::transform` for edits and source maps. That
affects printer choice, not the host contract.

## webpack

`@pandacss/webpack` ships as a loader-first adapter. It did not need the alias-backed synthetic module the earlier plan
assumed — the shared unplugin handles the runtime module:

- `pandaTransformer.webpack()` rewrites source and resolves `@pandacss-internal/css` (virtual module, not an alias).
- A `pre` `.css` loader injects `cssgen()` into any layer-declaring stylesheet in-memory — the Vite `.css` transform
  analog. It `addDependency`s every source, so a source edit rebuilds the stylesheet. Dev HMR without a disk write.
- The plugin builds the driver in `beforeCompile` and folds edits in via `watchRun`; the driver reads changed files
  through its own fs.

Tested on Next.js (webpack): `next build` emits the correct stylesheet, `next dev` HMRs style edits. Users keep
`@layer …;` in `globals.css`.

## Turbopack

Not built. The hard part isn't the transform — it's CSS delivery.

Turbopack has no plugin API, only loaders via `turbopack.rules` (run through `loader-runner`). The constraints:

- Loaders must return JavaScript. CSS/asset-emitting loaders aren't supported.
- Options must be plain data — no functions, no `require()`d modules.
- No virtual modules, no `emitFile`, no `resolve` (use `getResolve`). `addDependency` and `getOptions` do work.

So the webpack plugin machinery doesn't carry over, and `@pandacss-internal/css` can't resolve as a virtual module.

next-yak (which supports Turbopack) sidesteps this: its SWC transform encodes extracted CSS as `data:text/css;base64,…`
imports, which Turbopack's native CSS pipeline consumes — no virtual module, and the loader returns JS.

The crux for Panda: next-yak's CSS is per-component, so one data URL per module is natural. Panda's CSS is atomic,
layered, and deduped across the whole app — per-file data URLs would duplicate atoms everywhere and lose layer order.
The CSS-aggregation strategy is the design problem to solve first. An SWC plugin doesn't help: Panda's engine is OXC +
native NAPI, SWC plugins are SWC-AST + Wasm with no fs, and the CSS question stays open.

## Rspack

Rspack targets webpack plugin and loader compatibility. Implement the webpack adapter shape (now shipped) first, fork
only on real incompatibilities.

## Why not one host package for everything

Integration points differ too much:

- Vite and Rollup: plugin hooks and virtual modules
- Rolldown: runs the Rollup adapter unchanged
- webpack and Rspack: loader/plugin composition
- Turbopack: loaders only, no virtual modules — CSS must ride inline (data URLs)

One Rust core, one JS facade (`@pandacss/transformer`), small host adapters.

## Common internal module flow

```txt
source code
  → Rust transformer plans rewrites + which symbols to import
  → @pandacss/transformer returns rewritten code + map
  → host adapter intercepts @pandacss-internal/css
  → host adapter maps to internal module ID
  → host adapter returns bundled runtime source
```

The source import is stable across hosts. Only the internal resolved ID is host-native.

## Source maps

Host adapters must pass through source maps from transformed source. Rust emits v3 JSON when output changes.

The bundled internal runtime does not need a complex map. Transformed user source does.

## HMR and watch rules

The internal runtime is stateless in every host: no hidden globals, no runtime registration. Caching and invalidation
stay in the bundler, the adapter, and compiler caches.

## Recommended shipping order

1. `@pandacss/transformer` — done
2. Vite adapter — transform hooks done; sandbox e2e pending
3. Rollup adapter
4. webpack adapter
5. Rspack validation
6. Rolldown validation

## Acceptance bar per host

Each host is complete only when it passes:

1. source transform snapshots
2. internal module resolution
3. dead import cleanup
4. source map checks
5. watch / rebuild behavior
6. bundle-size fixture checks

## Related

- [Transformer](./README.md)
- [Test matrix](./test-matrix.md)
