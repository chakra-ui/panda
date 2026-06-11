---
title: Rust Codegen Design
date: 2026-05-29
status: draft
scope:
  - crates/pandacss_codegen
  - crates/pandacss_config
---

# Rust Codegen Design

## TL;DR

Rust codegen is moving toward a Panda-specific source generator instead of a direct port of the old JS package
generators. The current design has three core ideas:

- generate from a small, dedicated AST instead of concatenating whole files as strings,
- treat TypeScript as the canonical source and derive JS output by stripping generated TS-only syntax,
- model emitted files as config-dependent artifacts so watch mode can regenerate only the files affected by a config
  change.

The public config API is intentionally flat for now:

```ts
outExtension: "js" | "mjs" | "ts"
forceImportExtension: boolean
```

`outExtension` controls the emitted runtime file extension. The declaration extension is inferred from it, so v2 does
not need `forceConsistentTypeExtension`:

| `outExtension` | Runtime source | Type file |
| ---------------- | -------------- | --------- |
| `ts`             | `.ts` / `.tsx` | none      |
| `js`             | `.js`          | `.d.ts`   |
| `mjs`            | `.mjs`         | `.d.mts`  |

`forceImportExtension` controls whether generated import specifiers include the runtime/type extension. It is separate
from `outExtension` because some package/bundler setups still prefer extensionless internal specifiers, while Deno and
strict Node ESM paths need explicit specifiers.

`js` remains the default because extensionless directory imports (`styled-system/css`) resolve under TypeScript and
common bundlers without extra package configuration. `mjs` and `ts` remain explicit opt-ins; `ts` is the cleanest target
for Deno-like runtimes, especially when paired with `forceImportExtension: true`.

Migration from earlier v2 drafts:

```ts
// Before
codegenFormat: "mjs"
codegenImportExtensions: true
forceConsistentTypeExtension: true

// After
outExtension: "mjs"
forceImportExtension: true
```

`forceConsistentTypeExtension` is no longer needed: `outExtension: "mjs"` always pairs runtime `.mjs` with declaration
`.d.mts`.

## Current State

The Rust config crate owns the user-facing option:

```rust
pub enum CodegenFormat {
    Js,
    Mjs,
    Ts,
}
```

`crates/pandacss_codegen` owns:

- `ArtifactGraph`: fixed registry of generated artifact modules,
- `ConfigDependency` and `DependencySet`: compact dependency metadata for watch invalidation,
- `Module` / `Item` / `Expr` / `TsType`: a narrow AST tailored to Panda output,
- `emit_module`: printer for source TS, runtime JS, and declaration output,
- `strip_typescript`: generated-code-only TS erasure for JS output,
- artifact generators for `helpers`, `selectors`, `cx`, `css/index`, and `conditions`.

The current artifact graph is:

| Artifact     | Output stem    | Current dependencies                         |
| ------------ | -------------- | -------------------------------------------- |
| `Helpers`    | `helpers`      | `CodegenFormat`                              |
| `Selectors`  | `selectors`    | `CodegenFormat`                              |
| `Cx`         | `cx`           | `CodegenFormat`                              |
| `CssIndex`   | `css/index`    | `CodegenFormat`                              |
| `Conditions` | `conditions/*` | `CodegenFormat`, `Conditions`, `Tokens`      |

Each `ArtifactFile` carries its own dependency set:

```rust
pub struct ArtifactFile {
    pub path: String,
    pub code: String,
    pub dependencies: DependencySet,
}
```

This matters for watch mode. When a config section changes, the caller can compute a `DependencySet`, ask the graph for
affected artifacts, and write only the files whose dependencies intersect the changed bits.

## Why A Panda-Specific AST

The generated code is not arbitrary TypeScript. It has a small set of recurring shapes:

- imports and re-exports,
- runtime constants and functions,
- interfaces and type aliases,
- simple expressions,
- JSX component wrappers,
- raw function bodies for performance-sensitive helpers.

A full JS/TS AST would be more complete than we need and more expensive to keep ergonomic in Rust. A string-only system
would be smaller initially, but it makes these problems harder:

- emitting TS, JS, and DTS from one source of truth,
- controlling import specifier extensions,
- keeping type-only imports out of runtime JS,
- supporting JSX output without fragile text assembly,
- tracking whether a module needs `.ts` or `.tsx`,
- testing AST-level behavior without snapshotting entire files.

The chosen middle ground is a dedicated AST for module structure and declarations, with raw statement bodies allowed
inside functions where hand-written JS is the best way to keep output small and fast.

## Emission Model

Generation builds a `Module`, then emission decides the file shape:

```rust
EmitMode::SourceTs { ext, specifiers }
EmitMode::Split { format, specifiers }
```

For `outExtension: "ts"`:

- runtime and types are emitted together as `.ts`,
- modules with JSX emit `.tsx`,
- no separate declaration file is generated.

For `outExtension: "js"` or `"mjs"`:

- runtime JS is emitted as `.js` or `.mjs`,
- declaration output is emitted as `.d.ts` or `.d.mts`,
- type-only imports and type-only items are omitted from runtime output.

The same AST item can be marked by role:

```rust
pub enum ItemRole {
    Runtime,
    Type,
    Both,
}
```

This gives the printer enough information to emit the correct item in each target without duplicating the generator.

## TypeScript As Canonical Source

Helper function bodies are authored as TypeScript. Runtime JS is derived by stripping only the TS syntax we generate:

- function parameter annotations,
- local variable annotations,
- generic `new Set<T>()` / `new Map<K, V>()`,
- `as T` casts,
- typed local function bindings like `const fn: (...args: any[]) => any = function() {}`.

This mirrors the useful part of tools like Sucrase: erase types quickly without doing a full typecheck or semantic
transform. The difference is that our input language is intentionally narrower because it is generated by us.

This avoids maintaining two versions of helper bodies:

```ts
const mergeCss: (...styles: any[]) => any = function() {
  return mergeProps(...resolve(arguments))
}
```

becomes:

```js
const mergeCss = function() {
  return mergeProps(...resolve(arguments))
}
```

The TS source stays readable and typecheckable. The JS output stays compact.

## Import Specifiers

The emitter supports two policies:

```rust
pub enum ModuleSpecifierPolicy {
    Extensionless,
    RuntimeAndTypes,
}
```

`Extensionless` matches the common package/bundler setup:

```ts
import { css } from '../css';
import type { Conditions } from './types/system';
```

`RuntimeAndTypes` is intended for runtimes that require exact specifiers, especially Deno:

```ts
import { css } from '../css.ts';
import type { Conditions } from './types/system.ts';
```

For split JS output, runtime imports should point at `.js` or `.mjs`, while declaration imports should point at `.d.ts`
or `.d.mts` when the type target needs that explicit path.

## Helper Output Strategy

The helper artifact is currently one module from the user's perspective, but the Rust implementation is split by domain:

- `helpers/object.rs`
- `helpers/css.rs`
- `helpers/misc.rs`
- `helpers/patterns.rs`
- `helpers/recipes.rs`
- `helpers/split_props.rs`

This keeps generator code readable while preserving the generated API surface.

The runtime helper bodies are written for generated bundle size and hot-path behavior:

- short local aliases where they reduce repeated property reads,
- `for` loops in hot paths,
- `Object.create(null)` for dictionary-like output objects,
- `arguments` in local function expressions when it avoids rest array allocation,
- no large shared framework dependency.

Example from `createCss`:

```ts
const { utility: u, hash, conditions: c = { shift: (v: any) => v, finalize: (v: any[]) => v, breakpoints: { keys: [] } } } = context
const fmt = (s: string) => u.prefix ? u.prefix + "-" + s : s
const toClass = (paths: string[], name: string) => {
  const parts = c.finalize(paths)
  parts.push(hash ? name : fmt(name))
  return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
}
```

The balance is deliberate: variable names can be short inside dense helper internals, but exported names and public
types stay descriptive.

## Tests

Tests are integration-style files under `crates/pandacss_codegen/tests` rather than inline unit tests in source files.

Current coverage includes:

- artifact graph dependency filtering,
- TS vs JS/DTS file shape,
- extensioned import specifiers,
- helper artifact snapshots for TS, JS, and DTS,
- conditions/selectors/cx/css-index artifacts,
- JSX AST emission,
- isolated TS stripping behavior.

Generated helper TS has also been checked with strict TypeScript typechecking:

```sh
pnpm exec tsc -p /private/tmp/panda-helpers-ts-*/tsconfig.json
```

The important test rule is that artifact tests should show both:

- TS source output with explicit parameter and return types,
- JS runtime plus declaration output.

## Current Limitations

The codegen crate is still an early scaffold. Known gaps:

- `Patterns` has an initial artifact family, but transform-function parity still needs JS-prepared codegen metadata.
- `Recipes` is a dependency category but not a full artifact family yet.
- Framework component artifacts are not generated yet; only the JSX AST/emitter path is proven.
- Import maps are not wired into generated artifact paths.
- The TS stripper is intentionally narrow and should only be used on generated code.
- The artifact graph still has coarse artifact nodes; it does not yet expose one node per user pattern, recipe, or
  framework component.
- The helper artifact is generated as one output module even though internal Rust generator code is split.

These are acceptable constraints for this stage. They keep the crate small while validating the core model.

## Config Loading

Config loading is covered in [Config Loading Design](./config-loading-design.md). The key contract for codegen is that
JavaScript loads and resolves user config, then passes Rust a serialized `CodegenInput` with any source strings needed by
generated artifacts.

## Generated Types

Generated type strategy is covered in [Generated Types Design](./generated-types-design.md). The key direction is to
preserve autocomplete and recursive CSS nesting while replacing repeated inline unions with stable generated aliases.

## Pattern Transforms

The existing JavaScript generator does not use callback registry files for pattern transforms. It embeds trusted config
functions directly into each generated pattern module.

The current JS flow is:

1. User config is loaded and resolved as live JavaScript.
2. `packages/core` stores pattern configs with real `transform` functions.
3. `packages/generator/src/artifacts/js/pattern.ts` builds a source string with `javascript-stringify`:

```ts
const patternConfigFn = stringify(compact({ transform, defaultValues })) ?? ''
```

4. The generated pattern module embeds that source:

```ts
const stackConfig = {
  transform(props, helpers) {
    return { display: "flex", gap: props.gap }
  },
  defaultValues: { gap: "4" }
}

export const getStackStyle = (styles = {}) => {
  const _styles = getPatternStyles(stackConfig, styles)
  return stackConfig.transform(_styles, patternFns)
}
```

Rust receives JSON-safe config after functions have been replaced with callback references, so Rust cannot recreate this
source from `PatternConfig::transform` alone. The fix is to add a JS-prepared codegen payload that is created before
functions are stripped.

Proposed Rust-facing input:

```rust
pub struct CodegenInput {
    pub config: UserConfig,
    pub patterns: BTreeMap<String, PatternCodegenMeta>,
}

pub struct PatternCodegenMeta {
    pub config_source: String,
}
```

`config_source` is the already-stringified result of the trusted JS config object:

```ts
stringify(compact({
  transform: pattern.transform,
  defaultValues: pattern.defaultValues,
}))
```

This should be produced in the existing JS config/generator boundary, while `pattern.transform` is still a live
function. Rust codegen should not call `javascript-stringify`, and it should not invent a new user-facing callback-ref
API for this path.

Rust pattern emission then has two modes:

```ts
// Transform-source mode
import { getPatternStyles, patternFns } from '../helpers'

const stackConfig = /* PatternCodegenMeta.config_source */

export function stackRaw(styles?: StackProperties): Record<string, any> {
  const s = getPatternStyles(stackConfig, styles || {})
  return stackConfig.transform(s, patternFns)
}
```

```ts
// Fallback property-mapping mode
import { getPatternStyles } from '../helpers'

export function stackRaw(styles?: StackProperties): Record<string, any> {
  const s = getPatternStyles(stackConfig, styles || {})
  return {
    gap: s.gap
  }
}
```

No separate `callbacks.ts` artifact is needed for pattern transforms if we preserve this current generator behavior.
The existing compiler and compiler-wasm callback registration remains necessary, but it serves extraction/static CSS,
not generated runtime pattern files.

For the Rust target we can also avoid the old generator's dynamic helper-shim scan (`__spreadValues`, `__objRest`) for
now. Pattern files always import `getPatternStyles`; they import `patternFns` only when a transform source exists. The
Rust output is focused on modern `ts` and `mjs` generation rather than legacy helper shim compatibility.

Security model: this preserves Panda's existing trusted-config behavior. User config already executes during config
loading, and the old generator already embeds stringified transform functions into generated files. The Rust path should
carry that behavior through explicit JS-prepared metadata instead of trying to serialize arbitrary functions in Rust.

## Patterns Artifact

The first config-expanded artifact family is `patterns`.

Reasons:

- helper support already includes `patternFns` and `getPatternStyles`,
- the JSX AST test already points at `../patterns/stack`,
- pattern output is simpler than full framework component output,
- it forces the artifact graph to support config-expanded artifact families.

Expected no-transform fallback shape:

```ts
import { getPatternStyles } from '../helpers'

export function stackRaw(styles?: StackProperties): Record<string, any> {
  const s = getPatternStyles(stackConfig, styles || {})
  return {
    gap: s.gap
  }
}

export const stack = Object.assign(function stack(styles = {}) {
  return stackRaw(styles)
}, { raw: stackRaw })
```

After `patterns`, the natural order is:

1. recipes,
2. slot recipes,
3. JSX/framework component wrappers,
4. import-map-aware package entrypoints.

## Design Principles

- Keep public config simple until a second real use case forces more shape.
- Prefer typed Rust config data over reading old TS package types.
- Use AST for module/declaration structure; allow raw bodies only for performance-sensitive generated JS.
- Keep TS as the single maintainable source for helper bodies.
- Optimize generated runtime code, not generator implementation cleverness, when there is a tradeoff.
- Attach dependencies to artifacts and files so watch mode can be precise and cheap.
- Test emitted code as source code, not just as Rust data structures.
