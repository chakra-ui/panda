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

# Config authoring language service

Improve `panda.config.*` editing with a language service — not ambient generated types, and not config files that import
their own `styled-system` output.

You want token, recipe, condition, and utility completions while editing config. Package types can describe config
_shape_, but they can't know the merged design system after presets, string presets, and package presets resolve. That
needs config loading at edit time.

**Plan:**

- Stable package types for config shape
- Generated types for app code (`css`, JSX props, recipes, token helpers)
- A Panda language service for resolved completions, diagnostics, hover, and navigation
- No ambient globals; no `styled-system` imports in `panda.config.ts`

## The chicken-and-egg problem

`panda.config.ts` produces generated types. You also want the editor to know the design system _defined by_ that config
while you're writing it.

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

You need autocomplete and validation for `colors.red.500`, including preset tokens. TypeScript package types can't build
that dictionary — resolution runs through Panda's config loader and preset merge.

## What we're not doing

- Ambient generated types for config authoring
- `panda.config.ts` importing from `styled-system`
- Encoding the full resolved design system in static package types
- Requiring codegen before you can edit config
- Replacing TypeScript's normal type checking

## Why we dropped ambient types

v1 ambient types created a loop:

- Config produces generated types
- Generated types feed back into config authoring
- Output can be missing or stale
- Monorepos and package presets get fragile
- Editor behavior depends on output directory state

Project-specific unions also had to be globally visible. v2 skips that loop.

## Why package types aren't enough

`defineConfig` and `satisfies UserConfig` still help with shape and literal preservation:

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

A `const` generic can infer token paths from inline literals. It doesn't cover:

- Imported, string, package, computed, or JS presets
- Multi-config workspaces
- Resolved semantic token aliases
- Virtual tokens like `colors.colorPalette.*`

Autocomplete should reflect the resolved design system, not a TypeScript guess.

## How the pieces fit together

Intelligence once. Transport once. One first-party VS Code shell.

```txt
@pandacss/compiler/tooling          (subpath — shared by eslint, LSP, CLI doctor)
  config discovery, registry, spec index, file inspect, config token queries

@pandacss/language-server           (npm — `panda-language-server --stdio`)
  LanguageService (completions, diagnostics, hover) + LSP transport

VS Code extension                   (first-party — ship this for most users)
  spawn server, document selectors, workspace trust, color decorators, status
```

Reuse the same config resolver and compiler metadata as the CLI. Don't reimplement Panda semantics in the editor layer.

## Using it in your editor

We maintain one language server and one VS Code extension. Other editors talk to the same server through built-in LSP
clients — docs and config snippets, not separate extension repos.

| Layer                        | Who installs it | We maintain?         |
| ---------------------------- | --------------- | -------------------- |
| `@pandacss/compiler/tooling` | Transitive      | Yes (compiler subpath) |
| `@pandacss/language-server`  | npm / bundled in VSIX | Yes            |
| VS Code extension            | Marketplace     | Yes                  |
| Neovim / Helix / Emacs / Zed | User LSP config | Docs only (at first) |

You don't import the language service, run it by hand, or add generated types to config. The extension or LSP client
starts the server when the workspace has `panda.config.*`.

**VS Code:** install the Panda extension. It starts `panda-language-server`, registers TS/JS/TSX/JSX and config files,
and handles workspace trust plus optional color decorators.

**Other editors:** point your LSP client at the server binary. Neovim example:

```lua
require('lspconfig').panda.setup({
  cmd = { 'panda-language-server', '--stdio' },
  filetypes = { 'typescript', 'typescriptreact', 'javascript', 'javascriptreact' },
  root_dir = require('lspconfig.util').root_pattern('panda.config.{ts,js,mjs,cjs}'),
})
```

Helix, Emacs (`eglot` / `lsp-mode`), and Zed: same idea — `cmd` plus root dir on `panda.config.*`. Per-editor extensions
are optional later. They add polish, not core behavior.

TypeScript keeps type checking via `tsserver`. The Panda server runs in parallel and must not block TS completions.

## What TypeScript handles vs what Panda handles

**TypeScript:** syntax, types, imports, normal completions, generated app types.

**Panda language service:** token-path completions, `{token.path}` references, semantic token diagnostics, recipe/slot
metadata, conditions, utility hints, color previews, hover (resolved value + CSS var), go-to-definition, quick fixes for
bad token paths.

## Editing panda.config.ts

```ts
semanticTokens: {
  colors: {
    danger: {
      value: '{colors.re|}',
    },
  },
}
```

The server:

1. Finds the Panda project for this file
2. Loads and resolves the nearest config
3. Builds a token dictionary from config + presets
4. Detects the cursor inside a token reference string
5. Returns matching paths

Completions might look like:

```txt
colors.red.50
colors.red.100
colors.red.500
colors.red.900
```

Hover on `{colors.red.500}`:

```txt
colors.red.500
#ef4444
var(--colors-red-500)
Defined in @pandacss/preset-panda
```

Typo `{colors.reed.500}`:

```txt
Unknown token "colors.reed.500"
Did you mean "colors.red.500"?
```

## Editing app files

Same service, later phases:

```tsx
css({ bg: 'red.500' })
```

Token and utility completions, recipe variants, conditions, deprecated-token warnings, hover, color decorators.

Generated types stay the primary safety layer for app code. The language service adds editor intelligence on top.

## Why presets need a language service

```ts
export default defineConfig({
  presets: ['@pandacss/preset-panda', customPreset],
})
```

The service resolves the preset graph and completes from the merged design system. Package-level TypeScript can't model
string presets, external packages, JS presets, composition, `extend` merging, or condition/token normalization reliably.

## What `defineConfig` still does

Narrow job:

- Stable config shape typing
- Literal preservation
- Contextual typing and helper ergonomics
- No dependency on generated output

It does not encode resolved project metadata. Inline type helpers are best-effort for local tokens. The language service
owns resolved design-system data in the editor.

## Keeping editor and CI in sync

Share diagnostic logic with the CLI where you can. The editor gives fast feedback; CI is the source of truth.

```txt
panda check
```

and config validation during `panda codegen` should catch the same bad token references the editor flags.

## Caching and performance

Incremental and non-blocking:

- Cache resolved config per workspace/config path
- Debounce config reloads
- Watch config files and preset dependencies
- Rebuild indexes only when inputs change
- Never block TypeScript completions
- Return partial or empty Panda completions rather than freeze the editor

Watch: `panda.config.*`, preset files, resolvable package presets, manifests/lockfiles, `panda.buildinfo.json` if used.

```txt
file change → debounce → resolve config → merge presets → build index → publish diagnostics
```

## Loading config safely

Config loading runs user code. Same posture as the CLI:

- Load workspace config only
- No arbitrary background network
- Config-load errors become diagnostics
- Failures don't kill the language server
- Workspace trust gating in the VS Code extension

## Monorepos with multiple configs

```txt
apps/web/panda.config.ts
packages/ui/panda.config.ts
docs/panda.config.ts
```

Match files to config via include/exclude/source from the resolved config. If ambiguous, pick the nearest config and
surface a diagnostic or status message.

## LSP first, TypeScript plugin later

Ship LSP + VS Code extension first. A TS plugin can merge completions into `tsserver` later, but it's VS Code–centric
and doesn't help Neovim or Helix. Shared load/index logic lives in `@pandacss/compiler/tooling`; query + LSP logic
lives in `@pandacss/language-server`; wrappers stay thin.

## What you gain and what it costs

**Gain:** preset-aware autocomplete, no ambient types, no config/output loop, simpler type graph, monorepo-friendly,
shared editor/CLI diagnostics.

**Cost:** more packages, one VS Code extension to maintain, config cache complexity, language service must track
compiler semantics.

## Open questions

- Editor-only hints vs CLI errors — which diagnostics go where?
- Phase one scope for app files?
- How to watch package preset dependencies?
- Lightweight metadata endpoint from the Rust compiler for indexing?
- Should `panda.buildinfo.json` feed editor indexes for design-system packages?

## Ship this

Build config autocomplete as a language service, not ambient types.

Ship `@pandacss/language-server` and a VS Code extension together. Document LSP setup for
other editors. Skip per-editor extensions until someone needs the polish.

Package types for config shape. Generated types for app code. Language service for resolved design-system intelligence
in the editor.
