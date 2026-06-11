# Plugins and Hooks

## Summary

Panda v2 has one top-level extension field: `config.plugins`.

A **plugin** is a named, ordered bundle of lifecycle hooks. A **hook** is the lifecycle method inside a plugin
(`config:resolved`, `preset:resolved`, `parser:before`, `codegen:prepare`, `codegen:done`). There is no top-level
`config.hooks` in v2; local project behavior is an inline plugin.

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
        'config:resolved': ({ config }) => config,
        'parser:before': {
          filter: { id: '**/*.astro', code: { include: /css\(/ } },
          handler: ({ content }) => transformAstro(content),
        },
        'codegen:prepare': ({ artifacts }) => artifacts,
        'codegen:done': ({ files }) => {
          console.log(`generated ${files.length} files`)
        },
      },
    },
  ],
}
```

## Supported Hooks

- **Class A: config / construction**: `preset:resolved`, `config:resolved`. Host-only and may be async because config and
  preset resolution already run asynchronously.
- **Class B: output / batch**: `codegen:prepare`, `codegen:done`. Host-only and sync; prepare runs before generated
  files are written, done runs after.
- **Class C: per-file source transform**: `parser:before`. Hot path, sync-only, requires Rust-side filters.
- **Class D: per-unit hot path**: existing `utility.transform` / `pattern.transform` callbacks. Sync-only. General
  user-facing D hooks, including `parser:after`, are deferred.

The v2.0 scope is `config:resolved`, `preset:resolved`, `codegen:prepare`, `codegen:done`, existing typed callbacks,
`config.plugins`, and filtered `parser:before`.

## Filter and Invalidation Contract

Filters are serialized data, not callback refs. A filter edit is visible to structural diffing without hashing.

Handlers are lowered to callback refs with source hashes:

```ts
{ kind: 'js-hook', id: 'plugins.0.hooks.parser:before.0', filter, hash }
```

For Class C hooks, a filter or handler hash change conservatively invalidates parse caches because it can change which
files cross into JS and what source reaches Oxc.

## Runtime Contract

`preset:resolved` runs in the JS config host after each authored preset is loaded and before it is merged into the final
config. A returned config replaces the preset for the rest of resolution.

`config:resolved` runs in the JS config host after all authored presets are merged and before defaults and serialization.
It receives `{ config, path, dependencies, utils }`. A returned config replaces the config for defaulting and
serialization. Because it runs on the resolved shape, do not add new `extend` blocks there; update resolved keys directly
such as `theme.tokens`, `staticCss`, `patterns`, and `utilities`.

`parser:before` runs before native SFC adaptation and before Oxc parse:

```text
source -> Rust filter -> JS parser:before handler -> adapt_source -> Oxc parse
```

The handler must be synchronous. Async work belongs in config-time plugins that prepare data for sync hot-path hooks.
Runtime registration rejects promise-like results.

Rust owns filter matching (`id` glob/regex, `code` string/regex) and calls JS only when the filter admits the file.

`codegen:prepare` runs in the JS host before `Driver.codegen()` writes files and receives `{ artifacts, outdir, cwd }`.
It may return replacement artifacts. `codegen:done` runs after files are written and receives `{ files, outdir, cwd }`.
Both are synchronous so `Driver.codegen()` remains a sync API.

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
    'codegen:done': ({ files }) => {
      console.log(files.length)
    },
  },
}

// v2
export default {
  plugins: [
    {
      name: 'local',
      hooks: {
        'codegen:done': ({ files }) => {
          console.log(files.length)
        },
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

### `config:resolved`

Keep this hook for config rewrites such as generated `staticCss`, preset injection, pruning patterns, or validating
framework assumptions. Migrate root usage into a local plugin:

```ts
export default {
  plugins: [
    {
      name: 'local-config',
      hooks: {
        'config:resolved': ({ config, path, dependencies, utils }) => {
          const next = utils.omit(config, ['patterns.stack'])
          next.staticCss = {
            ...next.staticCss,
            css: [...(next.staticCss?.css ?? []), { properties: { color: ['red'] } }],
          }
          return next
        },
      },
    },
  ],
}
```

### `codegen:prepare` / `codegen:done`

Use `codegen:prepare` for generated JS/DTS rewrites before files are written. Use `codegen:done` only for synchronous
side effects after write, such as logging or copying small files. Prefer `codegen:prepare` when migrating hooks that
patch generated artifacts after codegen.

```ts
hooks: {
  'codegen:prepare': ({ artifacts }) => {
    const factory = artifacts.find((item) => item.id === 'jsx-factory')
    const file = factory?.files.find((item) => item.path.endsWith('.js'))
    if (file) file.code = file.code.replace('function styledFn', 'function styledFn')
    return artifacts
  },
}
```

### `cssgen:done`

`cssgen:done` is not in the initial v2 hook set. For final CSS cleanup like removing unused variables/keyframes, prefer
Panda's `optimize` options or a project PostCSS plugin after Panda. Reconsider a dedicated host-side CSS output hook only
when v2 has a stable CSS artifact contract.

### Removed Engine Hooks

Do not carry over `tokens:created`, `utility:created`, `context:created`, `parser:after`, `config:change`, or
`css:optimize` in v2. Their v1 use cases either map to declarative config, typed callbacks, host reload/diff APIs, or
would reopen hot-path engine internals.

## Related

- [Output & host layer (Driver)](./output-and-host-layer.md)
- [Scope and boundaries](./scope-and-boundaries.md)
- [Compiler lifecycle](./compiler-lifecycle.md)
- [Config loading](./config-loading-design.md)
- [Extraction pipeline](./extraction-pipeline.md)
