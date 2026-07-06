# Platform support

How the Rust-core transformer plugs into each host.

## Summary

The transformer should expose one host-neutral contract from Rust, surfaced through a thin JS facade. Each bundler host
adapts that contract to its own module resolution, watch, and source-transform APIs.

The abstract helper import emitted by the transformer is:

```ts
import { cn as __pcn } from '@pandacss-internal/transformer/cn'
```

Each host then resolves that import to its own internal module ID and source.

## Support matrix

| Host     | Transform hook shape                  | Helper module shape                      | Watch / invalidation model             | Status                        |
| -------- | ------------------------------------- | ---------------------------------------- | -------------------------------------- | ----------------------------- |
| Vite     | plugin `transform`                    | virtual module                           | dev server module graph + file watcher | first target                  |
| Rollup   | plugin `transform`                    | virtual module                           | watch cache + plugin invalidation      | first-class                   |
| Rolldown | Rollup-like plugin path               | virtual module                           | watch cache                            | planned, validate parity      |
| webpack  | loader or plugin-driven transform     | synthetic module or alias-backed runtime | loader dependencies + compiler watch   | first-class                   |
| Rspack   | webpack-compatible loader/plugin path | synthetic module or alias-backed runtime | loader dependencies + compiler watch   | first-class via webpack shape |

## Shared host contract

Every host adapter should do the same five things:

1. Select transformable source modules.
2. Call `packages/transformer` with source text and file path.
3. Return rewritten code plus source map.
4. Resolve `@pandacss-internal/transformer/cn`.
5. Register watch dependencies for any extra files the transform depends on.

The host adapter should not alter the helper contract or rewrite semantics.

The important nuance is where the work lives:

- Rust owns transform semantics
- the JS facade owns binding and host-facing return shape
- the bundler adapter owns only host APIs

## Vite

### Why Vite is a natural fit

Vite already exposes source rewriting in its plugin pipeline. The current Panda Vite plugin is the obvious first host
because it already owns Panda-specific file watching and CSS-root invalidation.

### Adapter shape

The Vite adapter should:

1. run in `transform`
2. resolve the helper import in `resolveId`
3. return helper source from `load`
4. keep helper invalidation stateless
5. call the JS facade backed by the native Rust transformer

Suggested internal resolved ID:

```txt
\0pandacss:transformer:cn
```

Suggested mapping:

- source import: `@pandacss-internal/transformer/cn`
- resolved internal ID: `\0pandacss:transformer:cn`

### Why `\0` for resolved IDs

That follows the same virtual-module pattern common in Vite and Rollup. The source import stays host-neutral; the
resolved ID becomes host-native.

### Watch behavior

The helper itself has no dynamic state. It should not need custom invalidation logic.

The transformed source files still need the existing Panda watch behavior:

- source file changes
- config changes
- any future cross-file transform dependencies

## Rollup

### Why Rollup can use the same adapter model as Vite

Rollup documents plugin-driven virtual modules with `resolveId` and `load`, and source rewriting through `transform`.
Its docs even show a simple virtual-module example and describe `transform` as the hook for source changes. Sources:

- Rollup virtual modules example: https://rollupjs.org/plugin-development/
- Rollup `transform` hook: https://rollupjs.org/plugin-development/

Specifically:

- Rollup shows intercepting a virtual module in `resolveId` and returning source in `load` (`virtual-module`)
  [turn3view6].
- Rollup exposes `transform(code, id)` for rewriting module source [turn3view5].

### Adapter shape

The Rollup adapter should mirror the Vite one:

1. `transform` calls `packages/transformer`
2. `resolveId` intercepts `@pandacss-internal/transformer/cn`
3. `load` returns helper source for the resolved internal ID

Suggested internal resolved ID:

```txt
\0pandacss:transformer:cn
```

### Watch behavior

Rollup watch mode and cached transforms mean the adapter should be careful to invalidate when source changes.

The helper source itself is static, so no special helper invalidation is needed. What matters is that transformed module
code is recomputed when the source file, config, or any future transform dependency changes.

## Rolldown

### Design stance

Design Rolldown support as Rollup-shaped first.

I could not verify the current Rolldown plugin docs directly from `rolldown.rs` in this session, so the conservative
call is:

- assume Rollup-like plugin hooks
- keep Rolldown support behind parity validation
- avoid baking Rolldown-specific assumptions into the transformer contract

### Adapter shape

If Rolldown's plugin surface matches Rollup closely enough, reuse the Rollup adapter with a thin package wrapper.

If it diverges, keep the same host-neutral import and helper source but swap only the adapter code.

Rolldown also matters on the implementation side, not just the host side. Its repo contains the Rust `string_wizard`
crate, which is a viable candidate for Panda's Rust-side edit application and sourcemap generation. That should
influence printer design, but not the host contract.

### Shipping rule

Do not call Rolldown support complete until:

1. virtual helper resolution works
2. source maps are correct
3. watch rebuilds re-run transformed modules

## webpack

### Why webpack needs a different adapter style

webpack is not Vite or Rollup. It already has strong loader and plugin primitives and a different module graph model.

That does **not** mean a different transformer contract. It means a different adapter.

webpack documents:

- loader context dependency tracking with `this.addDependency` [turn1view0]
- inline `matchResource` as a host-specific mechanism [turn1view1]

That tells us two things:

1. webpack can track extra file dependencies correctly from a loader.
2. webpack-specific resource tricks should stay in the webpack adapter, not the core transformer package.

### Adapter shape

The webpack adapter should be loader-first:

1. a Panda transform loader rewrites JS/TS source
2. the loader returns code + source map
3. the loader or companion plugin resolves `@pandacss-internal/transformer/cn`
4. the loader calls the JS facade backed by the native Rust transformer

There are two valid ways to provide the helper module:

#### Option A: alias-backed synthetic runtime module

- adapter intercepts the helper specifier
- webpack resolves it to an internal synthetic module
- plugin supplies the helper source

#### Option B: loader-injected runtime module request

- source loader rewrites the helper import to a webpack-private request
- companion loader returns the helper source

Option A is easier to reason about. Option B is closer to how webpack-specific CSS generation tricks work. Start with
whichever keeps the implementation smaller.

### Watch behavior

Use loader dependencies for anything beyond the current file:

- source file dependencies
- config file dependencies
- future transform-time dependency files

The helper runtime itself is static and does not need watch edges.

## Rspack

### Why Rspack should follow webpack first

Rspack's docs say it aims to be as compatible as possible with webpack's plugin API and that most webpack plugin APIs
are already compatible [turn3view2]. Its loader context also exposes `this.addDependency` with the same basic purpose
[turn3view0].

That strongly suggests the right design:

- implement the webpack adapter shape
- validate it on Rspack
- fork only if a real incompatibility appears

Sources:

- Rspack plugin compatibility statement: https://rspack.rs/api/plugin-api/
- Rspack loader dependency tracking: https://rspack.rs/api/loader-api/context

### Adapter shape

Rspack should start as:

- the same abstract helper import
- the same transform package
- the same loader-first adapter shape as webpack

If needed, the package can still be separate so users get an explicit `@pandacss/rspack` entry point.

### Watch behavior

Rspack's `this.addDependency(file)` contract is explicit: add a file dependency so changes can trigger recompilation
[turn3view0]. That matches the webpack plan cleanly.

## Why not one host package for everything

Because the integration points are too different:

- Vite and Rollup want plugin hooks and virtual modules.
- webpack and Rspack want loader/plugin composition.
- Rolldown needs parity validation first.

Trying to flatten those differences into one giant host package would make the code harder to test and reason about.

One Rust transformer core, one thin JS facade, and small host adapters is the cleaner split.

## Common helper ID flow

The flow should look the same in every host:

```txt
source code
  -> Rust transformer plans or prints import "@pandacss-internal/transformer/cn"
  -> JS facade returns rewritten code + map to the host
  -> host adapter intercepts that specifier
  -> host adapter maps it to an internal module ID
  -> host adapter returns helper source
```

The source import is stable across hosts. Only the internal resolved ID differs.

## Source maps

Every host adapter must preserve source maps from transformed source.

That matters for:

- dev debugging
- error overlays
- stack traces
- snapshot review of generated code

The helper module itself does not need a complex source map. The transformed source file does.

## HMR and watch rules

The helper must be stateless in every host:

- no host-specific caches inside helper source
- no hidden global state
- no runtime registration

All caching and invalidation stay in:

- the bundler
- the adapter
- the transformer planner or compiler caches

Never in the helper module.

## Recommended shipping order

1. `packages/transformer`
2. Vite adapter
3. Rollup adapter
4. webpack adapter
5. Rspack validation
6. Rolldown validation

That order lines up with implementation cost and confidence:

- Vite and Rollup share the virtual-module model.
- webpack and Rspack share the loader/plugin model.
- Rolldown should wait until we validate the actual plugin surface.

## Acceptance bar per host

Each host is complete only when it passes:

1. source transform snapshots
2. helper module resolution
3. dead import cleanup
4. source map checks
5. watch / rebuild behavior
6. bundle-size fixture checks

## Related

- [Transformer](./README.md)
- [Test matrix](./test-matrix.md)
