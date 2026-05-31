# Filesystem Abstraction

## Summary

`pandacss_fs` is a Tier-0 crate that abstracts every filesystem touch in the Rust pipeline behind a `FileSystem` trait.
Two impls ship behind cargo features: `OsFileSystem` (the `os` feature, default on native) and `MemoryFileSystem` (the
`memory` feature, default on all targets). Core crates (`pandacss_extractor`, `pandacss_project`, and future crates that
need I/O) call only through the trait — never `std::fs` directly — so the same code compiles to
`wasm32-unknown-unknown` for the browser playground with `--no-default-features --features memory`.

## Why a new crate, why now

Today only `CrossFileResolver::extract_exports` reads from disk (`std::fs::read_to_string`). One read path doesn't
justify an abstraction layer. But three forcing functions land at once:

1. **WASM / browser playground.** `wasm32-unknown-unknown` has no `std::fs`. The Rust engine has to run in the browser
   eventually (current playground uses ts-morph's `useInMemoryFileSystem`; v2 wants to swap to the Rust engine via
   wasm). Every `std::fs::*` call in core crates becomes a compile error on that target.
2. **Glob resolution for `include` / `exclude`.** Panda v1's `Runtime.fs.glob` (in `nodeRuntime`) handles
   `{ include, exclude, cwd }` discovery against `fast-glob`. The Rust side needs the same so a wasm host can feed
   source files through globbing rather than enumerating every path manually.
3. **Better tests.** `crates/pandacss_extractor/tests/cross_file.rs` writes to `tempfile::TempDir` today — slow, leaky,
   parallel-unsafe. In-memory fixtures fix all three.

The abstraction was originally scoped out (see [scope-and-boundaries](./scope-and-boundaries.md) before this note
landed). The WASM requirement reversed that decision.

## Crate evaluation

We deeply read `rolldown_fs` and surveyed the crate landscape before committing. Findings:

### Skip `rolldown_fs`

Rolldown's filesystem layer is the closest cousin to what we want. Their crate is ~350 LOC: a 40-LOC trait extending
`oxc_resolver::FileSystem`, ~100-LOC `OsFileSystem` wrapping `oxc_resolver::FileSystemOs`, ~200-LOC `MemoryFileSystem`
wrapping `vfs::MemoryFS`. The pattern is correct and we copy it.

**We do not depend on the crate directly.** Reasons:

- Pre-1.0 (`0.1.0`, 5K downloads). Description says "Filesystem abstraction layer for Rolldown" — not designed for
  external consumption. API will churn with their bundler needs.
- Pulls `vfs` (`0.12.x`) → transitively pulls `tokio`, `async-std`, `async-trait`, `futures`, `rust-embed`. That stack
  is fine for a native bundler; in a `<500 KB gzipped` wasm target it's malpractice.
- The pattern is ~50 LOC of trait code. Not worth a version-volatile dep we can't influence.

### Skip `vfs`

Mature (2.1M downloads, 0.13.0). Designed as a general async-aware virtual filesystem abstraction. The async-std +
tokio + futures + rust-embed dep chain alone is several hundred kilobytes of wasm overhead before any actual data. Our
needs (read file, read dir, list parents) collapse to a `FxHashMap<PathBuf, Vec<u8>>` plus a `FxHashSet<PathBuf>` for
directories. ~150 LOC vs. ~500 KB of transitive deps.

### Use `fast-glob`

The strongest find. By `oxc-project` (same org as our parser), 1.4M downloads, single dep (`arrayvec`), already present
in our `Cargo.lock` via `oxc_resolver`. Native brace expansion (`{ts,tsx}`), globstar (`**`), character classes,
negation. Matching API only — no filesystem walking — which is exactly what we want when composing with a pluggable FS
trait.

```rust
use fast_glob::glob_match;
assert!(glob_match("src/**/*.{ts,tsx}", "src/components/Button.tsx"));
```

### Use `oxc_resolver`

Already in deps. Our trait extends `oxc_resolver::FileSystem` so the resolver itself uses our FS impls (same trick
rolldown plays). Read-side primitives (`read`, `read_to_string`, `metadata`, `symlink_metadata`, `read_link`,
`canonicalize`) come for free.

### Considered and rejected

- **`globset`** (170M downloads, ripgrep family). Solid, but no native brace expansion — we'd write a 30-LOC
  pre-expander. `fast-glob` has it built in. `globset` also pre-compiles matchers, which doesn't matter at our
  pattern-set size (<20 patterns typical).
- **`wax`** (1.8M downloads, native braces). Pulls `nom` + `regex`. Heavier than `fast-glob`.
- **`ignore`** (123M downloads, ripgrep family). Adds gitignore semantics on top of globset + a walkdir wrapper. Useful
  when `pandacss_discover` lands; overkill now.
- **`walkdir`** (direct dep). Native-only (`std::fs`). Optional dev-dep behind the `os` feature for the OS-side glob
  override. Not in the wasm target.

## Trait surface

```rust
pub trait FileSystem: Send + Sync + oxc_resolver::FileSystem {
    // Write side (not in oxc_resolver::FileSystem)
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()>;
    fn create_dir_all(&self, path: &Path) -> io::Result<()>;
    fn remove_file(&self, path: &Path) -> io::Result<()>;
    fn remove_dir_all(&self, path: &Path) -> io::Result<()>;

    // Read side
    fn exists(&self, path: &Path) -> bool;
    fn read_dir(&self, path: &Path) -> io::Result<Vec<PathBuf>>;

    // Discovery — default walker; impls can override for perf.
    fn glob(&self, opts: &GlobOptions) -> io::Result<Vec<PathBuf>> {
        crate::glob::default_walk(self, opts)
    }
}

pub type SharedFileSystem = std::sync::Arc<dyn FileSystem>;
```

Inherited from `oxc_resolver::FileSystem`: `read`, `read_to_string`, `metadata`, `symlink_metadata`, `read_link`,
`canonicalize`.

**Out of scope** (deliberately):

- `watch` — JS host owns the watcher. Per [scope-and-boundaries](./scope-and-boundaries.md), native file watching is out
  of v2.x.
- `.gitignore` parsing — comes later with `pandacss_discover`. Pulling `ignore` now buys nothing.

## Glob semantics

`GlobOptions` mirrors `Runtime.fs.glob` from `@pandacss/types`:

```rust
pub struct GlobOptions {
    pub include: Vec<String>,    // glob patterns; empty → returns empty Vec
    pub exclude: Vec<String>,    // glob patterns to skip
    pub cwd: PathBuf,            // base directory for relative patterns
    pub absolute: bool,          // return absolute paths (matches JS default true)
}
```

Default `exclude` when the field is empty: `["**/*.d.ts"]`. The JS side auto-injects the same. **Adding
`**/node_modules/**` to the default is tempting but rejected** — JS doesn't do it, and a user who actually wants
`node_modules` scanned would be surprised.

**Walker algorithm** (the default `glob` impl, in `glob.rs`):

1. If `include` is empty → return `[]`. Matches JS.
2. For each entry from `self.read_dir(cwd)`, walked breadth-first:
   - Compute path relative to `cwd`.
   - If any `exclude` pattern matches → prune. **Important: pruning at the dir level skips descending entirely**, so
     `node_modules/**` in `exclude` never enters the directory.
   - If entry is a dir → push to queue.
   - Else if any `include` pattern matches → add to results.
3. Sort results for determinism.

The directory-pruning rule matters for performance. Without it, an exclude pattern for `node_modules/**` would still
call `read_dir` on every nested directory before filtering — orders of magnitude slower on real projects.

**`OsFileSystem` overrides `glob`** to use `walkdir` instead of recursive `read_dir`. Same `fast-glob` matchers, faster
directory traversal on native. The default walker stays in place for `MemoryFileSystem` (read_dir on a HashMap is
already O(1) per dir).

## Crate layout

```
crates/pandacss_fs/
  Cargo.toml
    [features]
    default = ["os"]
    os      = ["dep:walkdir"]
    memory  = []
    [dependencies]
    oxc_resolver = { workspace = true }
    fast-glob    = "1"
    rustc-hash   = { workspace = true }
    walkdir      = { version = "2", optional = true }
  src/
    lib.rs            re-exports + feature gates
    file_system.rs    FileSystem trait + GlobOptions type
    glob.rs           default walker + brace-expansion helpers (none — fast-glob handles it)
    os.rs             #[cfg(feature = "os")] OsFileSystem
    memory.rs         #[cfg(feature = "memory")] MemoryFileSystem
```

Tier-0 — sits below Tier 1 (`pandacss_tokens`, `pandacss_recipes`) in [crate-layering](./crate-layering.md). No
Panda-specific data shapes; pure infrastructure.

## WASM constraints

`OsFileSystem` is gated behind `#[cfg(feature = "os")]`. Disabling the `os` feature makes the type _not exist_, so any
code that tries to construct one fails at compile time rather than runtime. This is intentional — better a clear
"missing item" error in the wasm binding crate than a runtime panic.

**Wasm consumer crates use:**

```toml
[dependencies]
pandacss_fs = { workspace = true, default-features = false, features = ["memory"] }
```

CI gate (lands in Phase A):
`cargo check --target wasm32-unknown-unknown -p pandacss_extractor -p pandacss_project --no-default-features --features memory`
must pass cleanly. Any `std::fs::*` leak in core crates fails it.

## MemoryFileSystem semantics

```rust
#[derive(Default, Clone)]
pub struct MemoryFileSystem {
    inner: Arc<RwLock<State>>,
}

struct State {
    files: FxHashMap<PathBuf, Vec<u8>>,
    dirs:  FxHashSet<PathBuf>,
}
```

**`&self` for mutations via `RwLock`, not `&mut self`.** This is a deliberate divergence from rolldown's
`MemoryFileSystem` which uses `&mut self` on `add_file`. We want `Arc<dyn FileSystem>` consumers to populate the FS from
anywhere without coordinating mutable borrows — matters for the wasm playground where React effects push files into a
shared handle.

**Path normalization.** Paths are stored as-is; the consumer is responsible for using consistent separators. The wasm
binding will normalize to forward slashes at the JS boundary. On native, `OsFileSystem` uses platform-native separators.
Mixing modes in one process is supported but not tested.

**Directory bookkeeping.** Adding `/src/Button.tsx` auto-populates `/`, `/src` as directory entries so `read_dir` and
`metadata` work. `create_dir_all` adds explicit dir entries with no associated file. Removing a file does not remove
ancestor dirs (matches POSIX semantics).

**Symlinks aren't modeled.** `symlink_metadata` returns the same as `metadata`; `read_link` returns `NotFound`. If a
future need arises (yarn workspaces? pnpm symlinks?) we revisit. Cross-file resolution today doesn't traverse symlinks
meaningfully.

## Injection pattern

`CrossFileResolver` is the filesystem injection point:

```rust
// Native
let resolver = CrossFileResolver::default();

// Tests / wasm
let fs = MemoryFileSystem::from_iter([
    ("/src/Button.tsx", source),
    ("/src/tokens.ts", tokens_source),
]);
let resolver = CrossFileResolver::with_fs(fs);
```

`ExtractorConfig` stores an optional `CrossFileResolver`. `Project::from_config(config)` is the primary production
constructor; callers that need cross-file evaluation attach a resolver with `with_cross_file` before parsing files.
Matcher-only constructors remain lower-level/test entrypoints. On wasm, callers must provide a memory-backed resolver
because the native `os` feature is not available.

## Source scanning (`scan` / `glob`)

The fs engine is no longer just the cross-file resolver's read backend — it also powers **source discovery**. The binding
`Compiler` holds a clone of the same fs instance it gives the resolver (`OsFileSystem` on native, the host's
`MemoryFileSystem` on wasm) and exposes two entrypoints, backed by the generic
`pandacss_project::scan_files(fs, opts, parse)` helper:

- `glob(opts)` → `Vec<PathBuf>` — discovery only (the host's watch list).
- `scan(opts)` → `{ count, diagnostics }` — glob + `read_to_string` + `parse_file` each, entirely in Rust.

`opts` defaults to the config's `include`/`exclude`/`cwd`. This is what lets the JS host (the
[Driver](./output-and-host-layer.md)) avoid a JS glob dependency and reading files itself. `GlobOptions` is generic over
the concrete fs, so no `dyn` is needed — each binding monomorphizes over its one platform fs. See
[output-and-host-layer](./output-and-host-layer.md) for how the Driver drives this.

## Phase plan

**Phase A (shipped):**

1. `pandacss_fs` crate with trait + both impls + glob walker via `fast-glob`.
2. `CrossFileResolver` wired to inject FS (type-erased over `F: FileSystem`).
3. `tests/cross_file.rs` migrated from `tempfile` to `MemoryFileSystem`.
4. WASM target check on `pandacss_extractor` + `pandacss_project` passing.

**Phase B (shipped):**

5. `packages/compiler-wasm/` cdylib + wasm-bindgen wrapper.
6. `WasmFileSystem` + `WasmExtractor` exposed; `glob` at the JS surface.
7. Vitest smoke tests against the wasm artifact running in Node.
8. Bundle size measured: **~490 KB gzipped**, under 500 KB target.

## What this leaves for later

- **`pandacss_discover` crate.** When file discovery moves into Rust (currently JS does it), this crate would consume
  `pandacss_fs` for the walk + `ignore` for `.gitignore` semantics. Out of scope for Phase A/B.
- **Native file watching.** `notify-debouncer-full` style. Stays out of v2.x per
  [scope-and-boundaries](./scope-and-boundaries.md).
- **Persistent cache.** Add a crate only when cache behavior is implemented; it should use `pandacss_fs` for
  persistence rather than direct `std::fs` calls.

## Related

- [crate-layering](./crate-layering.md) — Tier 0 entry for `pandacss_fs`.
- [cross-file-resolution](./cross-file-resolution.md) — first consumer; gets the injection seam.
- [project-lifecycle](./project-lifecycle.md) — `Project::with_fs` constructor.
- [bindings](./bindings.md) — both NAPI and WASM cdylibs that consume `pandacss_fs`.
- [scope-and-boundaries](./scope-and-boundaries.md) — revised: glob is now in Rust, file discovery still isn't.
