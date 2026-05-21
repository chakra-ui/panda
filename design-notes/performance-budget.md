# Performance Budget

## Summary

Performance choices in the Rust pipeline are documented inline with `// PERF(port):` markers rather than centralized —
the reason a choice was made belongs next to the code that depends on it. This doc indexes the recurring decisions so
reviewers and benchmarkers can find them without grepping. **Don't flip any of these defaults without benchmark data.**

## Hashing: `rustc_hash::FxHashMap` everywhere internal

The pipeline never deals with adversarial input, so `SipHash`'s DoS resistance is pure waste. `FxHashMap` / `FxHashSet`
are used wherever keys are:

- Short well-known strings (`"css"`, `"theme"`, …) — `pandacss_tokens::TokenExtensions`, matcher allowlists.
- Newtype integer IDs (`SymbolId` u32) — `Resolver::cache`.
- Atom dedup sets — `Encoder::atoms`, `Project::atoms_cache`, `Project::atom_counts`.

The only `std::HashMap` in the workspace is in `CrossFileResolver`'s outer cache, where the key is a `PathBuf` (already
non-trivial to hash; the SipHash overhead is negligible relative to filesystem cost).

## Allocation: write-once `Box<str>` for atoms

`Atom::prop` and `AtomValue::String` use `Box<str>` instead of `String`. Atoms are write-once after the encoder records
them, so the capacity field a `String` carries is dead weight. Save: 8 bytes per string. At thousands of atoms per
project, this adds up.

## SmallVec for the common case

Two places use `SmallVec` to skip heap allocation in the common case:

| Site                     | Inline budget      | Common case                                       |
| ------------------------ | ------------------ | ------------------------------------------------- |
| `Atom::conditions`       | `INLINE_CONDS = 2` | 0-2 conditions per atom (`{ _hover: { md: … } }`) |
| `Encoder::path` (walker) | `INLINE_PATH = 8`  | Style objects nest ≤8 deep                        |

Spilling to heap still works correctly; the inline budget is sized so we don't spill in real code.

## Linear scan vs HashMap: `upsert` on `Vec<(String, Literal)>`

`literal::upsert` and `jsx::upsert` do insert-or-overwrite by key with a linear scan. O(n²) on object construction.

**Deliberately kept.** Real style objects rarely exceed ~50 keys; JSX prop lists rarely exceed ~30. At that scale the
`Vec` scan beats a `HashMap`-backed builder on cache locality and zero allocation. The crossover (where HashMap wins) is
somewhere around n=128 for `String` keys.

External reviewers flagging this should be pointed at benchmark data before flipping the default.

## Slot recipe iteration: O(slots × styles)

`SlotRecipe::atomic_styles_per_slot` rescans base / variants / compound for every slot. Total work is O(slots × styles).

**Deliberately kept.** The lazy iterator shape means callers that only need one slot pay only that slot's cost. If a
profile shows multi-slot consumers dominating, pre-bucketize once into `FxHashMap<&str, Vec<&Literal>>` and hand out
borrowed slices — but until benches force the change, the simpler shape wins.

## Single AST per file

`extract()` parses the source once and runs `collect_imports`, `collect_calls`, and `collect_jsx` against the same
`Program`. The staged entrypoints (`extract_calls`, `extract_jsx`) each re-parse — they exist for testing, not for
production batching. Use the `Extractor` session class for batches; it amortizes the matcher/dictionary setup across
calls.

## Incremental project atom cache

`Project` keeps a global `atoms_cache` plus `atom_counts`. Adding a parsed file increments each atom's refcount and
inserts first-seen atoms into the cache; replacing or removing a file decrements the old bucket and removes atoms whose
count reaches zero.

Read is the hot path — emitters, manifest writers, and tooling all call `project.atoms()` repeatedly between mutations.
The incremental cache preserves the cheap borrowed `&FxHashSet` read while making watch-mode updates O(file atoms)
instead of rebuilding from every file in the project.

## Fast path: no Panda imports

`extract()` bails immediately when `matched.is_empty()`. Skips the resolver build and both visitor walks. Parse
diagnostics still flow through; everything else short-circuits.

This is measurable on files that don't use Panda — `node_modules/**/*.js`, framework boilerplate, generated code — which
can dominate the input set in a real project.

## UTF-16 column walk

`LineIndex::locate` walks chars to compute UTF-16 columns — O(line length) per call. **Fine for diagnostic volumes**;
would matter if extraction-span locations became hot. Memoization per line is the obvious upgrade, but not warranted
until the cost shows up in a profile.

## What's not measured yet

- **`Literal::to_json()` cost across the NAPI boundary.** Used by `extract*()` for tooling consumers. The production
  `compile()` path must avoid it entirely (see [bindings](./bindings.md)).
- **Per-file parallelism.** Not built; tied to a deferred bulk-file API. The `parse_files(iter)` shape is the natural
  seam when it lands.
- **Native file watching.** Out of scope for v2.x. `notify-debouncer-full` + mpsc + oneshot is footnoted as a future
  workstream.

## Marker convention

The Rust crates use these exact strings so audits can run with `rg`:

```rust
// TODO(port): unsupported or uncertain behavior — must be behind TS fallback.
// PERF(port): known performance-sensitive translation; needs benchmark before default flip.
// SAFETY: invariant that makes an unsafe block valid (mandatory next to every unsafe).
// PORT NOTE: intentional reshaping from the TypeScript implementation.
```

Reviewers re-flagging a `PERF(port):` decision must provide benchmark data before the default flips. Re-flagging without
data is a no-op.

## Related

- [atomic-encoding](./atomic-encoding.md)
- [extraction-pipeline](./extraction-pipeline.md)
- [literal-evaluator](./literal-evaluator.md)
