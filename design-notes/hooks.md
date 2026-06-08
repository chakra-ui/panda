# Plugins and Hooks

## Summary

Panda v2 has one top-level extension field: `config.plugins`.

A **plugin** is a named, ordered bundle of lifecycle hooks. A **hook** is the lifecycle method inside a plugin
(`parser:before`, `cssgen:done`, etc.). There is no top-level `config.hooks` in v2; local project behavior is an
inline plugin.

```ts
export interface PandaPlugin {
  name: string
  hooks?: Partial<PandaHooks>
}

export interface Config {
  plugins?: PandaPlugin[]
}
```

This matches the common Rollup/Vite/PostCSS model: config contains plugins; plugins contain hooks.

## Plugin Ordering

Plugins run in array order. No `enforce: 'pre' | 'post'` in v2.0.

Presets and user config concatenate plugin arrays in source order:

```ts
[
  ...presetA.plugins,
  ...presetB.plugins,
  ...user.plugins,
  ...user.extend.plugins,
]
```

Plugins are not merged by `name` and are not deduped by default. Duplicate names may warn for diagnostics, but adding
the same plugin twice can be intentional.

## Hook Shape

A hook handler can be a function or an object hook with a Rust-evaluable filter:

```ts
type Hook<H> = H | { filter?: HookFilter; handler: H }

interface HookFilter {
  id?: string | RegExp | { include?: Array<string | RegExp>; exclude?: Array<string | RegExp> }
  code?: { include?: string | RegExp; exclude?: string | RegExp }
}
```

Example:

```ts
export default {
  plugins: [
    {
      name: 'local',
      hooks: {
        'parser:before': {
          filter: { id: '**/*.astro', code: { include: /css\(/ } },
          handler: ({ content }) => transformAstro(content),
        },
        'cssgen:done': ({ content }) => content,
      },
    },
  ],
}
```

## Boundary Classes

- **Class A: config / construction**: `config:resolved`, `preset:resolved`, `tokens:created`, `utility:created`,
  `context:created`, `config:change`. Host-only, may be async.
- **Class B: output / batch**: `cssgen:done`, `css:optimize`, `codegen:prepare`, `codegen:done`. Host-only,
  may be async.
- **Class C: per-file source transform**: `parser:before`. Hot path, sync-only, requires Rust-side filters.
- **Class D: per-unit hot path**: existing `utility.transform` / `pattern.transform` callbacks. Sync-only. General
  user-facing D hooks, including `parser:after`, are deferred.

The v2.0 scope is Class A/B, existing typed callbacks, `config.plugins`, and filtered `parser:before`.

## Filter and Invalidation Contract

Filters are serialized data, not callback refs. A filter edit is visible to structural diffing without hashing.

Handlers are lowered to callback refs with source hashes:

```ts
{ kind: 'js-hook', id: 'plugins.0.hooks.parser:before.0', filter, hash }
```

For Class C hooks, a filter or handler hash change conservatively invalidates parse caches because it can change which
files cross into JS and what source reaches Oxc.

## Runtime Contract

`parser:before` runs before native SFC adaptation and before Oxc parse:

```text
source -> Rust filter -> JS parser:before handler -> adapt_source -> Oxc parse
```

The handler must be synchronous. Async work belongs in config-time plugins that prepare data for sync hot-path hooks.
Runtime registration rejects promise-like results.

Rust owns filter matching (`id` glob/regex, `code` string/regex) and calls JS only when the filter admits the file.

## Native Plugins

Built-in SFC adapters (`vue`, `svelte`, `astro`) are native source-transform plugins: they run in Rust with no JS
boundary. Third-party JS transforms use filtered `parser:before`.

## Source Spans

`parser:before` should preserve byte offsets for v2.0. Length-changing transforms require sourcemap composition, which
is deferred until a real plugin needs it.

## Migration From v1

Move root `hooks` into a named local plugin:

```ts
// v1
export default {
  hooks: {
    'cssgen:done': ({ content }) => content,
  },
}

// v2
export default {
  plugins: [
    {
      name: 'local',
      hooks: {
        'cssgen:done': ({ content }) => content,
      },
    },
  ],
}
```

If a v1 config had both `plugins` and root `hooks`, put the local plugin where it should run. To preserve the old
append-after-plugins behavior:

```ts
export default {
  plugins: [vue(), typography(), { name: 'local', hooks: oldHooks }],
}
```

The v2 loader should reject root `config.hooks` with this migration hint instead of silently ignoring it.

## Related

- [Output & host layer (Driver)](./output-and-host-layer.md)
- [Scope and boundaries](./scope-and-boundaries.md)
- [Compiler lifecycle](./compiler-lifecycle.md)
- [Config loading](./config-loading-design.md)
- [Extraction pipeline](./extraction-pipeline.md)
