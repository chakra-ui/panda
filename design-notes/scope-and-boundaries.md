# Scope and Boundaries

## Summary

The Rust pipeline owns a deliberately narrow slice: parse → extract → encode → emit → optimize. A list of things it
explicitly **doesn't** own — and why — is more useful to future contributors than describing what it does. This doc is
that list.

## Not in scope

### File discovery beyond globbing

Glob resolution now lives in `pandacss_fs::FileSystem::glob` (`fast-glob`-backed, brace expansion + globstar). That
covers the `Runtime.fs.glob` contract from JS Panda. See [filesystem](./filesystem.md).

**Still out of scope:** `.gitignore`-aware walking, monorepo workspace detection, `package.json#workspaces` traversal.
When those land they go in a separate `pandacss_discover` crate built on `pandacss_fs` + the `ignore` crate. The binding
being the realistic-only consumer doesn't justify coupling `pandacss_project` or `pandacss_fs` to gitignore semantics
today.

### Source-file mutation / codemod

`ParsedFile` is intentionally read-only. It is _not_ a ts-morph `SourceFile` analog — Panda is an extractor, not a
codemod toolkit. Naming the type `SourceFile` would invite `copy()` / `move()` / `applyTextChanges()` / `save()`
requests that don't fit the role. The current naming is deliberate.

If a future feature needs to rewrite source (e.g. an auto-fix codemod), it should live in its own crate that consumes
the extractor's output, not bolt mutation onto `ParsedFile`.

### Per-file parallelism

Not yet done. Worth doing eventually via `rayon`, but tied to a deferred bulk-file API. A `parse_files(iter)` shape is
the natural seam when batch input lands — parallelism can opt in there without disturbing the single-file API surface.

The current `parse_file(path, source)` shape is already correct for parallel callers: hold the project behind a mutex,
fan out reads, fan in writes. Single-threaded for now keeps the encoder's path buffer and the resolver caches simple.

### CSS parsing

Hand-rolled emitter — **no CSS parser dependency**. Only `lightningcss` parses CSS, and only during the optimize phase.
The emitter produces CSS strings directly from `Atom` records; it doesn't read CSS back in.

**Why:** pulling in a full CSS parser for emission would be a bus-factor risk and a build-time cost the project doesn't
need. The output shape is determined by Panda's own rules, not by re-parsing user CSS.

### Framework-specific source preprocessing

`.vue`, `.svelte`, `.astro`, `.mdx` — single-file components are **preprocessed in JS**, then their `<script>` blocks
flow into the Rust extractor as plain TS/JS. The Rust crate stays framework-agnostic.

This mirrors the Tailwind v4 pattern. Maintaining framework-specific parsers in Rust would mean keeping `oxc_vue`-style
sister parsers in sync with upstream framework grammar changes — not worth the maintenance overhead for the (small)
wins.

### Per-file hooks

JS-side hooks fire at **phase boundaries** (batched), not per-file. Per-file hooks are a breaking removal from v1.
Plugin authors who needed per-file extension points get phase-batched alternatives.

**Why:** per-file hooks cross the NAPI boundary once per file, which dominates the per-file cost for trivial hook
bodies. Phase-batched hooks call into JS once per phase with the full batch, amortizing the boundary cost.

### Native file watching

`notify-debouncer-full` + mpsc + oneshot pattern is **out of scope for v2.x**. Footnoted on the migration cleanup phase
for future work.

The current model expects the JS host to own the watcher and route changed-file events through
`Project::refresh_file`. The contract (see [project-lifecycle](./project-lifecycle.md)) is structured to make this
trivial: unknown paths are silently filtered.

### Configuration parsing

`pandacss_config::SerializedConfig` is a placeholder. Config resolution still lives on the JS side; the resolved config
(matchers, design tokens, conditions) flows into the Rust pipeline as serializable structures.

**Why:** Panda's config supports recipes, hooks, presets, conditions, and a long tail of advanced features.
Reimplementing the resolution semantics in Rust would multiply the surface for parity bugs, and the cost it avoids (one
JSON serialization per session) isn't on the hot path.

### Hooks executing arbitrary JS

Even when the engine lands, `compile()` won't _call_ JS plugins from Rust. Plugin execution stays on the JS side, with
the Rust engine surfacing extraction results that JS-side hooks transform between phases.

## What this leaves the Rust pipeline owning

- AST parsing (via Oxc)
- Same-file + cross-file static evaluation
- Import matching against Panda category rules
- Recipe (`cva` / `sva`) parsing into typed shapes
- Atomic encoding (one atom per `(prop, value, condition_chain)`)
- CSS emission (planned — `pandacss_emitter` crate)
- CSS optimization via `lightningcss` (planned — `pandacss_optimizer` crate)

Each of those is a closed system with a serializable input and output shape. JS calls in with a config + sources, Rust
hands back CSS + manifest + diagnostics. Anything outside that contract lives on the JS side or in a separate crate.

## Related

- [crate-layering](./crate-layering.md)
- [project-lifecycle](./project-lifecycle.md)
