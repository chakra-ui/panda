---
title: Config Loading Design
status: draft
scope:
  - packages/config
  - crates/pandacss_codegen
  - crates/pandacss_config
---

# Config Loading Design

## Goal

The new Rust codegen still needs a JavaScript-side config loader. User configs are JavaScript or TypeScript modules, and
they can contain functions for patterns, hooks, presets, plugins, and other dynamic extension points. Rust should consume
a resolved, serialized input; it should not become responsible for executing arbitrary user config modules.

## Legacy Behavior

The legacy loader used `bundle-n-require`:

```ts
const { mod, dependencies } = await bundleNRequire(filepath, {
  cwd,
  interopDefault: true,
})
```

That package bundled the config with esbuild using `write: false`, read the bundled code from memory, temporarily patched
`require.extensions`, and executed the in-memory bundle with CommonJS `module._compile`. No config bundle was written to
disk in the normal path.

The important behavior to preserve is:

- bundle the config in memory,
- evaluate the bundle in memory,
- return the loaded config object,
- return the config dependency list for watch mode.

## Rolldown Loader

The new loader should use Rolldown as the only bundler. The current package already follows the right direction by
generating ESM with Rolldown and loading it through a `data:` URL:

```ts
const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
return import(dataUrl)
```

This should remain the default. We should avoid Vite's temp-file ESM fallback unless we hit a runtime constraint that
requires it. Vite writes temp files because it supports a broader set of config-loader modes and debuggability tradeoffs;
Panda can stay narrower and cheaper if in-memory loading is reliable for our config surface.

The compatibility target is the behavior, not the dependency: in-memory bundle, in-memory execution, and dependency
reporting. The new package should not re-add `bundle-n-require`.

## Result Shape

The proposed package shape is:

```ts
export async function loadPandaConfig(options: LoadConfigOptions): Promise<LoadedPandaConfig>
```

where the result contains:

```ts
interface LoadedPandaConfig {
  path: string
  config: ResolvedConfig
  dependencies: string[]
  codegen: CodegenInput
}
```

The important split is:

- `config` is the resolved runtime config used by the compiler,
- `dependencies` is the module list used by watch mode,
- `codegen` is the Rust-facing payload that preserves any source strings needed by generated artifacts.

## Pattern Codegen Metadata

For pattern transforms, the JS loader or resolver must prepare metadata before functions are stripped or converted to
callback references:

```ts
const configSource = stringify(compact({
  transform: pattern.transform,
  defaultValues: pattern.defaultValues,
})) ?? "{}"
```

That source string is passed to Rust as `PatternCodegenMeta.config_source`. Rust embeds the source in the generated
pattern module, but Rust never tries to stringify a JavaScript function itself.

## Dependency Tracking

Dependency tracking should be conservative and cheap:

- include the entry config path,
- include every absolute module id reported by Rolldown chunks,
- normalize paths relative to `cwd`,
- preserve the existing explicit `configDependencies` escape hatch as an additional dependency source.

This gives watch mode two layers of invalidation:

1. If a config dependency file changes, reload and resolve the config.
2. Once the resolved config changes, compute the affected `ConfigDependency` bits and regenerate only the impacted
   artifacts.
