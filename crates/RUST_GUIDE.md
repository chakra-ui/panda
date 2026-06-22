# Panda Rust Guide

Coding standards and review checklist for the v2 Oxc compiler engine (`crates/*`) and native bindings
(`packages/compiler/crate`, `packages/compiler-wasm/crate`).

**Elsewhere (do not duplicate here):**

| Topic                                            | Doc                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Monorepo workflows, Rust commands, CSS contracts | [`AGENTS.md`](../AGENTS.md) — Rust / Oxc Engine section                       |
| Architecture (why, not how)                      | [`design-notes/README.md`](../design-notes/README.md)                         |
| Crate tiers (full rationale)                     | [`design-notes/crate-layering.md`](../design-notes/crate-layering.md)         |
| Testing harness, insta, iteration                | [`design-notes/rust-testing.md`](../design-notes/rust-testing.md)             |
| NAPI / WASM boundary                             | [`design-notes/bindings.md`](../design-notes/bindings.md)                     |
| Performance defaults                             | [`design-notes/performance-budget.md`](../design-notes/performance-budget.md) |

---

## How to think about Rust changes here

Use a three-layer model before jumping to a fix:

```
Layer 3 — Panda domain (WHY)
  CSS snapshots, TS parity, crate tiers, NAPI thin boundary, Oxc single-parse hot path

Layer 2 — Design (WHAT)
  Ownership model, error strategy, data structures, which crate owns the behavior

Layer 1 — Mechanics (HOW)
  E0xxx errors, lifetimes, traits, iterators, unsafe, clippy
```

| Signal                          | Start at | Then                                                   |
| ------------------------------- | -------- | ------------------------------------------------------ |
| `E0382`, `E0597`, borrow fights | Layer 1  | Trace up — is ownership wrong for this pipeline stage? |
| "Where should this live?"       | Layer 3  | Read `design-notes/crate-layering.md`                  |
| CSS insta diff                  | Layer 3  | Investigate emit contract; never bulk-accept           |
| New `#[napi]` surface           | Layer 3  | Read `design-notes/bindings.md` — mirror types only    |
| `.clone()` everywhere           | Layer 2  | Restructure ownership before adding clones             |

Prefer **symptom → design → mechanics**, not **error → clone**.

---

## Review checklist

When reviewing Rust code in this repo, check each item.

### Style and API shape

- **Never** use **magic numbers** without explanation or named constants.
- **Always** use `#[must_use]` on functions returning `Result`, `Option`, or expensive-to-compute values callers should
  not silently discard.
- **Never** use `bool` function parameters. Prefer an enum or options struct.
- **Always** use `const fn` / `const` for compile-time-evaluable functions or constants where appropriate.
- **Always** avoid reinvented utilities. Reuse `pandacss_*` crates and workspace deps before adding bespoke helpers.

### Safety and suppressions

- **Always** avoid `static mut`. Use `OnceLock`, `LazyLock`, or other safe synchronization when global state is needed.
- **Always** flag missing `// SAFETY:` comments on `unsafe` blocks and `/// # Safety` on public `unsafe fn`.
- **Always** flag unjustified `unsafe impl Send` / `unsafe impl Sync`.
- **Always** flag `#[allow(...)]` where `#[expect(...)]` would work (include `reason = "..."` on either).
- NAPI `#[napi]` entry points may use `#[allow(clippy::needless_pass_by_value, reason = "...")]` — owned `String` is
  required by napi-rs.

### Ownership and allocation

- **Always** flag unnecessary `.clone()` / copies where borrowing or moving suffices.
- **Always** flag unnecessary `String` where `&str` works, or `Vec<T>` where a slice would do.
- Internal hash maps use `rustc_hash::FxHashMap` — not a smell here; document non-obvious sites with `// PERF(port):`.

### Panda-specific

- **Never** put compiler logic in `packages/compiler/crate` or `packages/compiler-wasm/crate` — mirror types and
  plumbing only.
- **Never** import upward across crate tiers — see `design-notes/crate-layering.md`.
- **Never** accept CSS snapshot changes without explicit review — see `AGENTS.md` Critical Rules.
- **Always** use port markers where applicable: `TODO(port):`, `PERF(port):`, `PORT NOTE:`, `SAFETY:`.
- Public integration tests belong in `crates/<name>/tests/`, not `#[cfg(test)]` in `src/` (except private helpers).

### Review-only extras

- **Always** flag silenced `#[must_use]` (`let _ = result` on values that should propagate).
- **Always** flag wildcard `_ =>` on domain enums (config, recipe, token) where new variants should be handled
  explicitly.
- **Always** flag missing `///` on new `pub` items; add `# Errors` on fallible public APIs where relevant.
- Prefer **parse, don't validate** — model invalid states as unrepresentable types rather than runtime checks alone.
- Non-trivial new `unsafe`: require `// SAFETY:` plus Miri consideration before merge.

---

## Coding guidelines

Non-obvious rules beyond "run rustfmt" (see `AGENTS.md` for fmt/clippy commands).

### Naming

| Rule                | Guideline                                                           |
| ------------------- | ------------------------------------------------------------------- |
| No `get_` prefix    | `fn name()` not `fn get_name()`                                     |
| Iterator convention | `iter()` / `iter_mut()` / `into_iter()`                             |
| Conversion naming   | `as_` (cheap ref), `to_` (expensive), `into_` (ownership transfer)  |
| Crate names         | `pandacss_*` underscore prefix; directory name matches package name |

### Data, errors, deprecations

| Rule                               | Guideline                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Newtypes for domain semantics      | `struct AtomProp(Box<str>)` where invariants matter                           |
| Pre-allocate on hot paths          | `Vec::with_capacity`, `String::with_capacity`                                 |
| Prefer `&str` / `Cow<str>`         | Over allocating `String` when borrowing suffices                              |
| Atoms use `Box<str>`               | Write-once after encoding — `design-notes/performance-budget.md`              |
| Propagate with `?`                 | Not `.unwrap()` in library crates                                             |
| `thiserror` for library errors     | Structured variants with context                                              |
| Parse-error contract               | Oxc recovers; treat non-empty `diagnostics` as authoritative for strict paths |
| `lazy_static!` / `once_cell::Lazy` | Prefer `OnceLock` / `LazyLock`                                                |

---

## Anti-patterns

| Anti-pattern                         | Why it's bad here                     | Better                                               |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------------- |
| `.clone()` to silence borrow checker | Hides ownership design; hot-path cost | Restructure borrows; `Arc` only when sharing is real |
| `.unwrap()` in `crates/*`            | Panics in compiler pipeline           | `?`, typed errors, or test-only unwrap               |
| Logic in NAPI crate                  | Duplicates core; breaks WASM parity   | Implement in `pandacss_*`, mirror at boundary        |
| Tier violation import                | Couples layers                        | Move shared types down a tier                        |
| Bulk insta accept                    | Masks CSS regressions                 | `cargo insta review -p <crate>` per diff             |
| `std::HashMap` for hot internal keys | Slower than needed                    | `FxHashMap` (standard here)                          |
| Re-parse per entrypoint in prod      | `extract()` is single-parse           | Use combined `extract()` on hot path                 |

| Smell                            | Action                                  |
| -------------------------------- | --------------------------------------- |
| Many `#[allow(clippy::…)]`       | Fix root cause or switch to `#[expect]` |
| Giant `match` arms in encoder    | Extract functions                       |
| `String` in Oxc visitor hot loop | Borrow source text via spans            |
| New dep in Tier 1                | Justify or move logic to Tier 2         |

---

## Unsafe and NAPI

Every `unsafe` block requires `// SAFETY:`. Public `unsafe fn` requires `/// # Safety`. No panics across NAPI/WASM
boundary without documented handling. Details: `design-notes/bindings.md`.

---

## Review output

Use this format for PR and diff reviews (human or agent). Pre-review gates: `pnpm rust:fmt` and `pnpm rust:clippy` from
repo root — if either fails, **Block** before manual review.

### Severity

| Level    | Meaning                     | Examples                                                                                     |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| CRITICAL | Must fix before merge       | CSS snapshot without justification, tier violation, `unsafe` without `SAFETY`, prod `unwrap` |
| HIGH     | Should fix before merge     | Unjustified clone on hot path, missing tests, stale `#[allow]`                               |
| MEDIUM   | Fix if touching nearby code | Missing pub docs, long functions                                                             |

### Verdict

| Verdict     | Condition                                      |
| ----------- | ---------------------------------------------- |
| **Approve** | No CRITICAL or HIGH findings                   |
| **Warning** | MEDIUM only                                    |
| **Block**   | Any CRITICAL or HIGH finding, or failing gates |

### Findings table

```markdown
## Gate results

- `pnpm rust:fmt`: pass
- `pnpm rust:clippy`: pass
- Targeted tests: pass | skipped

## Verdict

**Approve**

## Findings

| Severity | Location                 | Finding                                 |
| -------- | ------------------------ | --------------------------------------- |
| HIGH     | crates/foo/src/bar.rs:88 | Unnecessary clone in extractor hot loop |
```

Report only high-confidence issues. Skip nits clippy already enforces and advice that conflicts with documented Panda
choices (`FxHashMap`, `Box<str>` atoms, etc.).

---

## Subagents

Defined in **`.claude/agents/`** (Cursor and Claude Code both discover this path).

| Agent                     | Use for                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `rust-engineer`           | Implement, debug, design — ownership, tiers, NAPI, stylesheet |
| `rust-reviewer`           | Read-only review — PRs, diffs (`readonly: true`)              |
| `oxc-extractor-architect` | Oxc parse, visitors, literal fold, cross-file, SFC adapters   |
| `rust-perf-analyst`       | `PERF(port):` flips, benches, allocation hot paths            |
