---
title: Design systems — deferred and open questions
status: draft
scope:
  - crates/pandacss_project
  - crates/pandacss_codegen
  - packages/config
  - packages/compiler
  - packages/compiler-wasm
related:
  - design-system-manifest.md
  - virtual-styled-system.md
  - build-info.md
---

# Design systems — deferred and open questions

## Summary

`designSystem` ships across Phases 1–6: resolve a manifest, merge its preset, hydrate its build info, and emit only the
app's overlay. This note is the honest ledger of what it does **not** do yet, and why. Read it before you file a bug or
pick up a follow-up — some gaps are deliberate, some are timing, and a couple degrade quietly enough to surprise you.

Each entry says what's missing and why, plus what you get instead where there's a workaround.

## Deferred — planned, not built

### Overlay codegen for nested chains

Overlay codegen only kicks in for a single-level `designSystem`. A nested chain (`app → @acme/ds → @acme/base`) still
emits the full local styled-system.

Why: with two design systems in play, `css` and the jsx factory are exported by both packages, so a naive
`export * from '@acme/ds/css'` plus `export * from '@acme/base/css'` collides and drops the name. Getting the barrels
right needs per-root disambiguation we haven't designed.

Today: merge and hydrate across the chain both work (Phase 3), so the CSS and tokens are correct. You just pay for a
duplicated runtime in the app until this lands.

### Browser (wasm) overlay

The overlay runs in the Node host only. The wasm binding ignores the `overlay` field, so `@pandacss/compiler-wasm`
consumers get the full tree.

Why: the browser path (playground, StackBlitz) rarely consumes a published design system, so it wasn't worth the wire
work yet. The field is safe to pass — wasm deserialization drops unknown keys — so wiring it later is additive.

### Build-info tree-shaking to the consumer's imports

A design system hydrates its whole build info, not just the modules the app actually imports.

Why: per-import tree-shaking needs the app's import graph resolved against the design system's module keys before
hydration. The plumbing exists in `build-info.md` but isn't wired to the consumer yet.

Today: correct output. Panda hydrates more of the design system than the app imports, so a large library costs more work
than it should — the extra atoms dedupe away, they just take time to process.

### TypeScript `paths` generation

Panda doesn't write `paths` into your tsconfig. Resolution rides on the package `exports` `panda lib` syncs.

Why: package exports resolve for every bundler we've tested, so `paths` is redundant weight. If a bundler shows up that
can't resolve subpath exports, this becomes the fallback.

### Bundler externalization guidance

`panda lib` makes styled-system a real package export, but a design system author still has to mark styled-system
specifiers as external when they bundle their own components, or a DTS bundler can re-resolve a local `styled-system`
folder as input. We don't document or validate this yet.

Why: it's a docs-and-lint job, not engine work. Track it with the runtime-alias setup notes for Vite, Nuxt, Next
webpack, and Next Turbopack.

### A `styles.css` fallback for non-Panda consumers

v1's `panda ship` could scaffold a plain `styles.css` for consumers that don't run Panda. v2 hasn't ported that.

Why: the design-system path assumes a Panda consumer that hydrates build info. A prebuilt-CSS fallback for non-Panda
apps is a separate deliverable, wanted only if that audience shows up.

## Known limitations — works, but degrades

### An unresolved token becomes dead CSS, silently

Reference a token the upgraded design system no longer defines and Panda emits it as a literal CSS value with no
warning. A breaking token removal turns into dead CSS, not a build error.

Why: the compiler resolves tokens against the merged config and has no record of "this used to exist." The token-aware
lint plugin reads the resolved config and is the intended guardrail; a build-time warning for unresolved token
references is a possible follow-up.

### The generic runtime is emitted locally, not deduped

The overlay re-exports the design system's recipe, pattern, and jsx-component definitions, but still emits the generic
runtime — `css`, `cva`, `cx`, `sva`, `helpers`, the jsx factory, `tokens`, `conditions`, `types` — locally from the
merged config.

Why: the app's own recipe and pattern modules import that runtime by relative path (`../helpers`, `../css/cx`). If the
overlay skipped those files, the relative imports would dangle and a real bundler build would fail. So the win is scoped
to the library-sized part (definitions), not the fixed-size runtime. Deduping the runtime too would mean rewriting the
app delta modules' relative imports to point at the design-system package — a bigger, more fragile change deferred to a
later pass.

### Cross-package source watch

Editing a workspace design system's source refreshes its JS through your bundler, but Panda only watches manifest and
build-info paths, so the CSS can lag until the design system rebuilds.

Why: watching cross-package source globs is broader than the manifest-path watching in place today. Track this against
the dev-mode watch work.

## Open questions — undecided

### Workspace-protocol and symlink resolution

`designSystem` resolves a package's `panda.lib.json` through normal Node resolution, which covers `node_modules`, pnpm
symlinks, and Docker layers. What we haven't confirmed is a `workspace:@acme/ds` specifier and every symlink shape a
monorepo can throw at it.

### Private token visibility

A design system can't yet mark tokens as private to the library. Everything it defines is visible to the consumer's
types. This is a type-surface question, not a manifest one, and it's unresolved.

## Non-goals — deliberately out of scope

### Plural `designSystem`

The field is singular. The cases that look plural usually aren't: a package that _consumes_ a design system belongs in
`include`, and a child that _extends_ one records its parent in the manifest. The real plural case — two design systems
defining the same token path — opens precedence, layer, and hash-space questions we won't take on without clear demand.

### Registry integration and versioned federation

No auto-publishing, no registry, no versioned federation output. `panda lib` writes files; you publish them with npm.
Versioning a token-shape break is the author's semver responsibility, not something Panda polices. Panda enforces only
`schemaVersion` and the `panda` peer range.

### Runtime manifest consumption

`panda.lib.json` is a build-time contract. Nothing reads it at runtime.

## Related notes

- [Design-system manifest](./design-system-manifest.md) — the manifest, resolution, and delivery phases.
- [Virtual styled-system](./virtual-styled-system.md) — overlay codegen and the styled-system exports.
- [Build info](./build-info.md) — portable extraction and the tree-shaking model.
- [Chakra UI design-system migration](./chakra-ui-design-system-migration.md) — tracks its own consume-side open
  questions (component metadata generation, safelist for dynamic props, `--update-tsconfig`, per-bundler alias docs).
