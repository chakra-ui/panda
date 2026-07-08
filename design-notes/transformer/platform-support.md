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

| Host     | Transform hook shape                  | Internal module shape                    | Watch / invalidation model             | Status                    |
| -------- | ------------------------------------- | ---------------------------------------- | -------------------------------------- | ------------------------- |
| Vite     | plugin `transform`                    | virtual module                           | dev server module graph + file watcher | transform hooks wired     |
| Rollup   | plugin `transform`                    | virtual module                           | watch cache + plugin invalidation      | planned                   |
| Rolldown | Rollup-like plugin path               | virtual module                           | watch cache                            | planned; validate parity  |
| webpack  | loader or plugin-driven transform     | synthetic module or alias-backed runtime | loader dependencies + compiler watch   | planned                   |
| Rspack   | webpack-compatible loader/plugin path | synthetic module or alias-backed runtime | loader dependencies + compiler watch   | planned via webpack shape |

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

Rollup uses the same virtual-module model as Vite: `resolveId`, `load`, and `transform`.

The Rollup adapter should mirror Vite:

1. `transform` calls `@pandacss/transformer`
2. `resolveId` intercepts `@pandacss-internal/css`
3. `load` returns bundled runtime for `\0pandacss:internal:css`

`@pandacss/transformer` already exports `rollup` via `unplugin` for early integration tests.

## Rolldown

Design Rolldown support as Rollup-shaped first. Validate plugin parity before calling it complete.

Rolldown maintains `string_wizard`, which Panda already uses in `pandacss_project::transform` for edits and source maps.
That affects printer choice, not the host contract.

Shipping rule: do not mark Rolldown done until helper resolution, source maps, and watch rebuilds all pass.

## webpack

webpack needs a loader-first adapter, not a different transform contract.

1. Panda transform loader rewrites JS/TS source
2. Loader returns code + source map
3. Loader or companion plugin resolves `@pandacss-internal/css`
4. Loader calls `@pandacss/transformer` backed by the native compiler

Start with alias-backed synthetic module resolution unless a smaller loader-injected request path is clearly better.

Use `this.addDependency` for config and future cross-file edges. The internal runtime itself is static.

## Rspack

Rspack targets webpack plugin and loader compatibility. Implement the webpack adapter shape first, fork only on real
incompatibilities.

## Why not one host package for everything

Integration points differ too much:

- Vite and Rollup: plugin hooks and virtual modules
- webpack and Rspack: loader/plugin composition
- Rolldown: needs parity validation first

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
