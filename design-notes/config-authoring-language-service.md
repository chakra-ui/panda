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

Intelligence once. TS plugin transport first — it's the cheapest way to reach the file types that matter (config +
app files are plain TypeScript, and `tsserver` has already parsed them).

```txt
@pandacss/compiler/tooling          (subpath — shared by eslint, plugin, CLI doctor)
  config discovery, registry, spec index, file inspect, config token + style-object queries, module resolution

@pandacss/typescript-plugin         (npm — tsserver plugin, runs in-process)
  LanguageService (completions, diagnostics, hover, module resolution) + ts.server.PluginModule adapter

packages/vscode (thin)              (first-party — registers the plugin, doesn't spawn a process)
  contributes.typescriptServerPlugins, workspace trust, optional color decorators

@pandacss/language-server           (deferred — only for non-TS-native template files)
  reuses the same LanguageService; adds an LSP transport when Vue/Svelte/Astro templates need coverage tsserver can't give
```

Reuse the same config resolver and compiler metadata as the CLI. Don't reimplement Panda semantics in the editor layer.
See [language-service-implementation.md](./language-service-implementation.md) for the full rationale and phased
rollout.

## Using it in your editor

We maintain one tsserver plugin and one thin VS Code extension. Other tsserver-backed editors load the same plugin
through their own TypeScript integration — docs and config snippets, not separate extension repos.

| Layer                         | Who installs it               | We maintain?               |
| ------------------------------ | ------------------------------ | --------------------------- |
| `@pandacss/compiler/tooling`  | Transitive                     | Yes (compiler subpath)      |
| `@pandacss/typescript-plugin` | npm / bundled in VSIX          | Yes                         |
| VS Code extension (thin)      | Marketplace                    | Yes                         |
| Neovim / Helix / Emacs / Zed  | User `tsconfig.json` + TS host | Docs only                   |
| `@pandacss/language-server`   | Deferred                       | Only for non-TS templates   |

You don't import the language service, run it by hand, or add generated types to config. The plugin loads inside
`tsserver` itself when the workspace has `panda.config.*`.

**VS Code:** install the Panda extension. It registers `@pandacss/typescript-plugin` with the built-in TypeScript
extension via `contributes.typescriptServerPlugins` — no server process to spawn, no settings sync, workspace trust
plus optional color decorators.

**Other tsserver-backed editors:** add the plugin to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@pandacss/typescript-plugin" }]
  }
}
```

Works anywhere `tsserver` runs the workspace's `typescript` — Neovim (`typescript-tools.nvim`, `ts_ls`), Zed, Emacs
(`lsp-mode`'s `ts-ls`). No separate binary, no `root_dir` LSP wiring.

**Non-TS-native templates (Vue, Svelte, Astro):** out of scope until [Deferred: standalone
LSP](./language-service-implementation.md#deferred-standalone-lsp) — `tsserver` doesn't parse these files, so the
plugin can't reach them; those need a real LSP integrated with the frameworks' own language tooling.

TypeScript keeps type checking via `tsserver`. The Panda plugin runs inside the same process and must not block or
crash the host's TS completions — see the [proxy/decorator
pattern](./language-service-implementation.md#why-ts-plugin-before-lsp).

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

## TS plugin first, LSP later

Ship a tsserver plugin + thin VS Code extension first. `panda.config.ts` and most app files are plain TypeScript —
`tsserver` already parses them, so a plugin reuses that parse for free instead of standing up a second server,
protocol layer, and process to manage. It reaches VS Code, JetBrains, and any tsserver-backed Neovim/Zed/Emacs setup
with zero extra infrastructure.

An LSP is deferred until non-TS-native template files (Vue, Svelte, Astro) actually need coverage — `tsserver` can't
parse those regardless of transport, so that's the point a real LSP earns its cost. Shared load/index logic lives in
`@pandacss/compiler/tooling`; query logic lives in `@pandacss/typescript-plugin/service`, reusable unchanged by a
future LSP adapter. Full rationale: [language-service-implementation.md](./language-service-implementation.md#why-ts-plugin-before-lsp).

## What you gain and what it costs

**Gain:** preset-aware autocomplete for tokens and style objects (recipes, globalCss, staticCss), module resolution
without generated tsconfig paths, no ambient types, no config/output loop, monorepo-friendly, shared editor/CLI
diagnostics, cheap reach (VS Code + tsserver-backed editors) before paying for a standalone LSP.

**Cost:** the plugin runs in-process with `tsserver` — bugs or slow calls degrade the user's whole TS experience, not
just Panda's features. Config cache complexity and version-skew risk across the TypeScript versions users select
still apply either way.

## Open questions

- Editor-only hints vs CLI errors — which diagnostics go where?
- How much app-file coverage ships before non-TS templates are requested?
- How to watch package preset dependencies?
- Lightweight metadata endpoint from the Rust compiler for indexing?
- Should `panda.buildinfo.json` feed editor indexes for design-system packages?
- Real demand signal for non-TS-native templates before starting the deferred LSP work

## Ship this

Build config autocomplete as a language service, transported first via a tsserver plugin — not ambient types, not an
LSP up front.

Ship `@pandacss/language-server` and a VS Code extension together. Document LSP setup for
other editors. Skip per-editor extensions until someone needs the polish.

Package types for config shape. Generated types for app code. Language service for resolved design-system intelligence
in the editor.
