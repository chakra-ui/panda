# Scope and Boundaries

## Summary

The Rust pipeline currently owns parse → extract → encode → emit for the native compiler path. Built-in Vue/Svelte/Astro
masking runs in `pandacss_extractor` before Oxc. Optimization, persistent cache, file discovery beyond globbing, and MDX
preprocessing remain deliberately outside the current project/extractor contract. A list of things it explicitly **doesn't**
own — and why — is more useful to future contributors than describing what it does. This doc is that list.

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

### CSS parsing / optimization

Hand-rolled emitter — **no CSS parser dependency** in the current native stylesheet path. `pandacss_stylesheet` produces
CSS strings directly from `Atom` and recipe records; it doesn't read CSS back in.

**Why:** pulling in a full CSS parser for emission would be a bus-factor risk and a build-time cost the project doesn't
need. The output shape is determined by Panda's own rules, not by re-parsing user CSS.

There is also no raw string optimizer. A previous whitespace post-pass was removed because it could corrupt significant
CSS whitespace in descendant selectors and quoted values. If optimization lands, it must be CSS-aware (for example
`lightningcss`) and live behind an explicit optimizer boundary.

### Framework-specific source preprocessing

Built-in `.vue`, `.svelte`, and `.astro` adapters run in Rust via `pandacss_extractor::adapt_source` before Oxc parse.
They mask template/frontmatter into position-preserving TS/JS so spans stay aligned with the original file. See
[hooks](./hooks.md#native-plugins) and `crates/pandacss_extractor/src/{vue,svelte,astro}_adapter.rs`.

**Still out of scope:** `.mdx` and other formats without a native adapter. Third-party transforms can use filtered
`parser:before` on the JS host before the masked source reaches Oxc.

Maintaining framework-specific parsers in Rust is limited to the built-in SFC set; keeping sister parsers in sync with
every upstream framework grammar is not worth the maintenance overhead for the long tail.

### Per-file hooks

Most v1 per-file hooks are removed. v2 keeps one filtered per-file hook: `parser:before` (Class C in
[hooks](./hooks.md)). Config and output hooks remain phase-batched on the JS host.

**Why:** unfiltered per-file hooks cross the NAPI boundary once per file, which dominates the per-file cost for trivial
hook bodies. Rust-side filters plus phase-batched hooks amortize boundary cost; `parser:before` stays because some
framework transforms still need arbitrary JS.

### Native file watching

`notify-debouncer-full` + mpsc + oneshot pattern is **out of scope for v2.x**. Footnoted on the migration cleanup phase
for future work.

The current model expects the JS host to own the watcher and route changed-file events through `Project::refresh_file`.
The contract (see [project-lifecycle](./project-lifecycle.md)) is structured to make this trivial: unknown paths are
silently filtered.

### Configuration parsing

`pandacss_config::UserConfig` is the Rust-facing resolved config input. Config resolution still lives on the JS side;
Rust does not execute `panda.config.*`, presets, hooks, or plugins. The resolved config flows into
`pandacss_project::System::new(config)`, which compiles extractor matchers, JSX config, utility metadata, conditions,
breakpoints, patterns, recipes, and token dictionary data into runtime structures.

**Why:** Panda's config supports recipes, hooks, presets, conditions, and a long tail of advanced features.
Reimplementing the resolution semantics in Rust would multiply the surface for parity bugs, and the cost it avoids (one
JSON serialization per session) isn't on the hot path.

Config compilation is fallible. Invalid runtime structures that Rust must compile, such as serialized JSX regexes,
return `pandacss_project::ConfigError` through `System::new(config)` / `Project::from_config(config)` instead of being
silently ignored or panicking. `pandacss_config::Theme` is typed for the structural fields Rust consumes today
(`breakpoints`, recipes, slot recipes, theme variants, containers, color palette). Nested style/token trees still use
`serde_json::Value` where the Rust port has not claimed the full semantic shape yet.

### Hooks executing arbitrary JS

`compile()` does not _call_ JS plugins from Rust. Plugin execution stays on the JS side, with
the Rust engine surfacing extraction results that JS-side hooks transform between phases.

## What this leaves the Rust pipeline owning

- AST parsing (via Oxc)
- Same-file + cross-file static evaluation
- Import matching against Panda category rules
- Recipe (`cva` / `sva`) parsing into typed shapes
- Atomic encoding (one atom per `(prop, value, condition_chain)`)
- CSS emission through `pandacss_stylesheet`
- CSS optimization later via a CSS-aware optimizer such as `lightningcss`

Each of those is a closed system with a serializable input and output shape. JS calls in with a config + sources, Rust
hands back CSS + manifest + diagnostics. Anything outside that contract lives on the JS side or in a separate crate.

## Related

- [crate-layering](./crate-layering.md)
- [project-lifecycle](./project-lifecycle.md)
