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

Intelligence once. Two thin transports over the same core, built together — not sequentially — because TypeScript 7
(Corsa/`tsgo`) is about to GA without support for the classic `tsserver` plugin API our original plan leaned on. See
[language-service-implementation.md](./language-service-implementation.md#revised-both-transports-ship-in-phase-1-not-sequentially)
for the full reasoning.

```txt
@pandacss/compiler/tooling          (subpath — shared by eslint, plugin, language server, CLI doctor)
  config discovery, registry, spec index, file inspect, config token + style-object queries, module resolution

@pandacss/typescript-plugin         (npm — tsserver plugin, runs in-process with classic Strada tsserver)
  LanguageService (completions, diagnostics, hover, module resolution) + ts.server.PluginModule adapter

@pandacss/language-server           (npm — thin LSP transport over the same LanguageService)
  for tsgo --lsp / TypeScript 7 (Corsa), and any generic LSP client

packages/vscode (thin)              (first-party — registers the plugin, doesn't spawn a process)
  contributes.typescriptServerPlugins, workspace trust, optional color decorators
```

Reuse the same config resolver and compiler metadata as the CLI. Don't reimplement Panda semantics in the editor layer.
See [language-service-implementation.md](./language-service-implementation.md) for the full rationale and phased
rollout.

## Using it in your editor

We maintain one tsserver plugin, one LSP server, and one thin VS Code extension. Other tsserver-backed editors load the
plugin through their own TypeScript integration; any generic LSP client (including `tsgo`-backed editors) points at
the LSP server instead — docs and config snippets, not separate extension repos.

| Layer                         | Who installs it                | We maintain?           |
| ----------------------------- | ------------------------------ | ----------------------- |
| `@pandacss/compiler/tooling`  | Transitive                     | Yes (compiler subpath) |
| `@pandacss/typescript-plugin` | npm / bundled in VSIX          | Yes                    |
| `@pandacss/language-server`   | npm                            | Yes                    |
| VS Code extension (thin)      | Marketplace                    | Yes                    |
| Neovim / Helix / Emacs / Zed  | User `tsconfig.json` + TS host, or LSP client config | Docs only |

You don't import the language service, run it by hand, or add generated types to config. The plugin loads inside
classic `tsserver` when the workspace has `panda.config.*`; the LSP server runs as its own process for everyone else.

**VS Code:** install the Panda extension. It registers `@pandacss/typescript-plugin` with the built-in TypeScript
extension via `contributes.typescriptServerPlugins` — no server process to spawn, no settings sync, workspace trust plus
optional color decorators. Works whether VS Code's TS install is classic Strada or TypeScript 7 (Corsa) transitions
smoothly to the LSP path.

**Other tsserver-backed editors (classic TypeScript):** add the plugin to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@pandacss/typescript-plugin" }]
  }
}
```

Works anywhere classic `tsserver` runs the workspace's `typescript` — Neovim (`typescript-tools.nvim`, `ts_ls`), Zed,
Emacs (`lsp-mode`'s `ts-ls`). No separate binary, no `root_dir` LSP wiring.

**`tsgo`/TypeScript 7 (Corsa), or any generic LSP client:** point at `panda-language-server --stdio` instead — same
completions, same underlying `LanguageService`, different transport.

**Non-TS-native templates (Vue, Svelte, Astro):** out of scope until
[Phase 4](./language-service-implementation.md#phase-4--non-ts-templates-demand-gated) — no TS-parsed AST exists for
these files under either transport; they need integration with the frameworks' own language tooling.

TypeScript keeps type checking via `tsserver`/`tsgo`. The Panda plugin runs inside the same process as classic
`tsserver` and must not block or crash the host's TS completions — see the
[proxy/decorator pattern](./language-service-implementation.md#why-a-plugin-at-all-still-applies-to-the-classic-adapter).

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

## Two transports, built together

Ship a tsserver plugin, an LSP server, and a thin VS Code extension in the same phase. The original plan was
plugin-first with the LSP deferred until non-TS-native template files (Vue, Svelte, Astro) needed it — `panda.config.ts`
and most app files are plain TypeScript, so a plugin reusing `tsserver`'s own parse is genuinely the cheaper transport
for those files.

That's still true, but it's no longer the whole story: TypeScript 7 (Corsa/`tsgo`) is reaching GA without support for
the classic plugin API the plugin depends on — its own interface is `tsgo --lsp`. Betting only on the classic plugin
now means the whole editor story stops working the moment a user's workspace TypeScript moves to Corsa, with no
defined replacement API yet. Since the query logic already lives in a transport-agnostic
`@pandacss/typescript-plugin/service`, building the LSP adapter alongside the plugin adapter is cheap insurance, not a
redesign — see
[language-service-implementation.md](./language-service-implementation.md#revised-both-transports-ship-in-phase-1-not-sequentially)
for the full reasoning. Non-TS-native templates remain their own, separate, still-deferred trigger for deeper Phase 4
work, unrelated to the Corsa question.

## What you gain and what it costs

**Gain:** preset-aware autocomplete for tokens and style objects (recipes, globalCss, staticCss), module resolution
without generated tsconfig paths, no ambient types, no config/output loop, monorepo-friendly, shared editor/CLI
diagnostics, and editor support that survives the Strada → Corsa transition without a rewrite.

**Cost:** two adapters to maintain instead of one, though both are thin wrappers over the same core. The plugin still
runs in-process with classic `tsserver` — bugs or slow calls degrade the user's whole TS experience there specifically.
Config cache complexity and version-skew risk across TypeScript versions apply either way.

## Open questions

- Editor-only hints vs CLI errors — which diagnostics go where?
- How much app-file coverage ships before non-TS templates are requested?
- How to watch package preset dependencies?
- Lightweight metadata endpoint from the Rust compiler for indexing?
- Should `panda.buildinfo.json` feed editor indexes for design-system packages?
- Real demand signal for non-TS-native templates before starting Phase 4
- Once Corsa ships its own IPC-based plugin mechanism, whether a third adapter is worth it or the LSP transport
  already covers it

## Ship this

Build config autocomplete as a language service. Ship a tsserver plugin and an LSP server together, over one shared
core, plus a thin VS Code extension — not ambient types, not a single-transport bet in an ecosystem mid-migration.
Document LSP setup for other editors. Skip per-editor extensions until someone needs the polish.

Package types for config shape. Generated types for app code. Language service for resolved design-system intelligence
in the editor.
