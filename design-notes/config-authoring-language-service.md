---
title: Config Authoring Language Service
status: proposed
scope:
  - packages/config
  - packages/compiler
  - packages/compiler-shared
  - packages/types
  - future language service / editor integration
---

# Config Authoring Language Service

## Summary

Panda should improve `panda.config.*` authoring with a language-service layer instead of generated ambient types or config
files that depend on their own generated output.

The core problem is project-specific autocomplete: users want token, semantic token, recipe, condition, and utility
completions while editing config. Plain TypeScript types can provide the config shape, but they cannot reliably know the
fully resolved design system when presets, string presets, package presets, and merged config are involved.

The proposed direction is:

- keep stable package types for config shape,
- keep generated types for app usage (`css`, JSX props, recipes, token helpers),
- add a Panda language service for resolved design-system completions, diagnostics, hover, and navigation,
- avoid ambient project globals and avoid importing generated `styled-system` types from `panda.config.ts`.

## Problem

Config authoring has a chicken-egg problem.

`panda.config.ts` is the source used to produce generated types, but users also want config authoring to be aware of the
design system defined by that config and its presets.

For example:

```ts
export default defineConfig({
  presets: ['@pandacss/preset-panda'],
  theme: {
    semanticTokens: {
      colors: {
        danger: {
          value: '{colors.red.500}',
        },
      },
    },
  },
})
```

The desired editor experience is autocomplete and validation for `colors.red.500`, including tokens from presets.
TypeScript package types alone cannot know the resolved token dictionary because resolution requires Panda config loading
and preset merging.

## Non-Goals

- Do not require ambient generated types for config authoring.
- Do not require `panda.config.ts` to import from `styled-system`.
- Do not encode the full resolved design system into static package types.
- Do not make generated types a prerequisite for editing config.
- Do not replace TypeScript's normal type checking.

## Why Not Ambient Types

The v1-style ambient approach made config authoring feel global and time-dependent:

- config produces generated types,
- generated types influence config authoring,
- generated output can be missing or stale,
- monorepos and package presets become fragile,
- editor behavior depends on output directory state.

This also increases type graph complexity because project-specific unions must be made globally visible.

V2 should avoid that loop.

## Why Package Types Alone Are Not Enough

`defineConfig` and `satisfies UserConfig` are still useful for shape checking and literal preservation:

```ts
export default defineConfig({
  theme: {
    tokens: {
      colors: {
        red: {
          500: { value: '#f00' },
        },
      },
    },
  },
})
```

A `const` generic helper can infer token paths from the same object literal, but this only covers local inline tokens. It
does not fully solve:

- imported presets,
- string presets,
- package presets,
- computed presets,
- JS presets,
- multi-config workspaces,
- resolved semantic token aliases,
- virtual tokens such as `colors.colorPalette.*`.

For enterprise usage, autocomplete should reflect the actual resolved design system, not a TypeScript approximation.

## Proposed Architecture

Introduce a shared Panda language-service core and editor-facing wrappers.

```txt
@pandacss/language-service
  - config discovery
  - config loading / resolution
  - preset merging
  - design-system index
  - completions
  - diagnostics
  - hover
  - go-to-definition
  - code actions

@pandacss/language-server
  - LSP transport
  - file watching
  - workspace/project management

VS Code extension / editor integrations
  - starts the language server
  - registers document selectors
  - optional color decorators
```

The language service should reuse the same config resolver and compiler metadata as the CLI/runtime where possible. It
should not reimplement Panda semantics separately.

## Responsibilities

TypeScript continues to handle:

- syntax errors,
- TypeScript type checking,
- import errors,
- normal completions,
- generated app type checking.

Panda language service handles Panda-specific project intelligence:

- token-path completions,
- `{token.path}` reference completions,
- semantic token reference diagnostics,
- recipe and slot recipe metadata,
- condition completions,
- utility property/value hints,
- color previews,
- hover with resolved token value and CSS variable,
- go-to-definition for token references,
- quick fixes for unknown token paths.

## Config Authoring UX

When editing:

```ts
semanticTokens: {
  colors: {
    danger: {
      value: '{colors.re|}',
    },
  },
}
```

the editor asks the Panda language server for completions. The server:

1. Determines the file belongs to a Panda project.
2. Loads and resolves the nearest config.
3. Builds a token dictionary from local config and presets.
4. Detects the cursor is inside a token reference string.
5. Returns matching token-path completions.

Example completions:

```txt
colors.red.50
colors.red.100
colors.red.500
colors.red.900
```

Hovering:

```ts
value: '{colors.red.500}'
```

can show:

```txt
colors.red.500
#ef4444
var(--colors-red-500)
Defined in @pandacss/preset-panda
```

A typo:

```ts
value: '{colors.reed.500}'
```

can produce:

```txt
Unknown token "colors.reed.500"
Did you mean "colors.red.500"?
```

## App File UX

The same service can enhance app files:

```tsx
css({ bg: 'red.500' })
```

Possible features:

- token completions,
- utility value completions,
- recipe variant completions,
- condition completions,
- deprecated token diagnostics,
- hover previews,
- color decorators.

Generated types remain the primary TypeScript safety layer for app usage. The language service is additive.

## Presets

Preset-aware autocomplete is the main reason to prefer a language service.

Given:

```ts
export default defineConfig({
  presets: ['@pandacss/preset-panda', customPreset],
})
```

the service resolves the actual preset graph and builds completions from the final merged design system.

This handles cases that package-level TypeScript helpers cannot reliably model:

- string presets,
- external packages,
- JS presets,
- preset composition,
- `extend` merging,
- condition and token normalization.

## Relationship To `defineConfig`

`defineConfig` should still exist, but its job is narrow:

- provide stable config shape typing,
- preserve literals,
- improve contextual typing,
- support helper ergonomics,
- avoid dependency on generated output.

It should not try to fully encode resolved project metadata.

A lightweight type-level authoring layer may still help for local inline config, but it should be considered best-effort.
The language service is the authoritative editor intelligence for resolved design-system data.

## Diagnostics And CI

Editor diagnostics must share logic with CLI diagnostics where possible.

The language service can show fast feedback while editing, but CI should rely on CLI validation. This avoids editor-only
correctness.

For example:

```txt
panda check
```

or config validation during `panda codegen` should catch the same invalid token references that the editor reports.

## Caching And Performance

The language service must be incremental and non-blocking.

Recommended behavior:

- cache resolved config per workspace/config path,
- debounce config reloads,
- watch config files and preset dependencies,
- rebuild token/recipe indexes only when relevant inputs change,
- never block TypeScript completions,
- return partial/no Panda completions rather than freezing the editor.

Watch targets include:

- `panda.config.*`,
- preset files,
- package preset dependencies when resolvable,
- relevant package manifests/lockfiles,
- generated build info if used.

Config reload flow:

```txt
file change
-> debounce
-> resolve config
-> merge presets
-> build design-system index
-> publish diagnostics
```

## Security

Config loading can execute user code. The language service should follow the same security posture as the CLI:

- only load workspace config,
- avoid arbitrary background network work,
- surface config-load errors as diagnostics,
- isolate failures so the language server stays alive,
- consider explicit trust/workspace gating in editor extensions.

## Multiple Configs

Enterprise monorepos may contain multiple Panda configs.

The service should support multiple projects in one workspace:

```txt
apps/web/panda.config.ts
packages/ui/panda.config.ts
docs/panda.config.ts
```

File-to-config matching should use include/exclude/source matching from the resolved config. If ambiguous, prefer nearest
config and expose diagnostics or status output.

## LSP vs TypeScript Plugin

A TypeScript plugin can provide good VS Code/tsserver integration, but an LSP is more editor-neutral.

Recommended layering:

- implement `@pandacss/language-service` as transport-agnostic core,
- expose an LSP server,
- optionally expose a TypeScript plugin wrapper later.

This avoids coupling all intelligence to tsserver while still allowing deep TS-editor integration where useful.

## Tradeoffs

Benefits:

- preset-aware autocomplete,
- no ambient generated types,
- no config/output chicken-egg dependency,
- lower TypeScript type complexity,
- better enterprise monorepo behavior,
- shared diagnostics between editor and CLI.

Costs:

- more moving parts,
- editor integration work,
- config loading/cache complexity,
- language service must stay in sync with compiler semantics,
- non-VS Code editor support requires LSP polish.

## Open Questions

- Should the first implementation be VS Code extension + language-service core, or full LSP from day one?
- Which diagnostics should be editor-only hints vs CLI errors?
- How much app-file intelligence should be included in phase one?
- How should package preset dependency watching work?
- Can the Rust compiler expose a lightweight metadata endpoint for editor indexing?
- Should `panda.buildinfo.json` participate in editor indexing for design-system packages?

## Recommendation

Build config authoring autocomplete as a Panda language service, not as ambient generated types.

Use stable package types for config shape, generated types for app code, and the language service for resolved
design-system intelligence. This gives the best enterprise-grade balance: accurate preset-aware autocomplete without
growing the TypeScript type graph or making config depend on its own generated output.
