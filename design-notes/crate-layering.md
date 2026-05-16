# Crate Layering

## Summary

The `crates/` workspace is organized as a three-tier dependency line, not a flat bag of crates. Dependencies point one
way — leaf data crates know nothing about traversal, traversal crates know nothing about orchestration. The shape makes
refactors correctness-preserving and stops future contributors from accidentally coupling a leaf crate to walker
machinery.

## The three tiers

### Tier 1 — leaf data + parsing

`pandacss_tokens`, `pandacss_recipes`.

Pure data models with parsing from `pandacss_extractor::Literal` to typed shapes. No traversal, no encoding, no I/O.
`pandacss_recipes` depends on `pandacss_extractor` for `Literal`, but only as a serializable input shape — not for
walker machinery.

### Tier 2 — process

`pandacss_extractor`, `pandacss_encoder`.

`pandacss_extractor` parses sources via Oxc and produces `Literal` values plus `ExtractedCall` / `ExtractedJsx` records.
`pandacss_encoder` consumes Tier 1 types (`Recipe`, `SlotRecipe`, `Literal`) and produces atomic `Atom` records. They're
sibling tiers — different axes of work, neither depends on the other.

### Tier 3 — façade

`pandacss_project`.

The `PandaProject` crate wires everything together. It's the primary entry point for `@pandacss/binding` and the
recommended entry point for any Rust consumer. Read-only DX surface; the binding talks to this, not to the lower tiers
directly. See [project-lifecycle](./project-lifecycle.md).

### Placeholder tiers

`pandacss_cache`, `pandacss_config`, `pandacss_emitter`, `pandacss_optimizer`, `pandacss_engine` are skeletons today.
When they're built out, they'll slot in roughly as:

- `pandacss_config` — Tier 1 (serializable config).
- `pandacss_cache`, `pandacss_emitter`, `pandacss_optimizer` — Tier 2 (process atoms into CSS).
- `pandacss_engine` — Tier 3 (orchestrates the full extract → encode → emit → optimize pipeline).

## Standing answers to merge questions

These come up periodically — the standing answer is here so we don't re-litigate.

**"Should `pandacss_encoder` + `pandacss_recipes` merge into one `core` crate?"** — No. Dependencies go one way (encoder
reads Recipe; recipes doesn't know about Encoder), and Tier-1 consumers should not pull `smallvec` / walker machinery
transitively. Merging is reversible later; splitting clean code post-merge is annoying.

**"Should `pandacss_project` own file discovery?"** — No, not yet. The binding being the realistic-only consumer doesn't
justify coupling the façade to `ignore` / fs. When file discovery lands it goes in a separate `pandacss_discover` crate
(likely using the `ignore` crate for `.gitignore` parity with JS-side `tinyglobby`).

**"Should `pandacss_project` mutate source files?"** — No. `ParsedFile` is intentionally read-only. It is _not_ a
ts-morph `SourceFile` analog — naming it `SourceFile` would invite `copy()` / `move()` / `applyTextChanges()` requests
that don't fit Panda's extractor role.

**"Should `pandacss_extractor` know about `pandacss_tokens`?"** — Yes, but narrowly. `pandacss_extractor` depends on
`pandacss_tokens` so the static evaluator can fold `token('colors.red.500')` calls. The dependency is one-directional;
`pandacss_tokens` knows nothing about `pandacss_extractor`.

## Why one-way

Panda v2 is fundamentally a one-way pipeline:

```
extract → encode → emit → optimize
```

The crate layout makes that direction visible at the dependency level. When asked "where does feature X go?", trace the
data direction:

- New parsing of a `Literal` shape → Tier 1 (`pandacss_recipes`, `pandacss_tokens`, or a new sibling).
- New traversal that emits atoms → Tier 2 (extend `pandacss_encoder`).
- New cross-cutting orchestration that owns multi-file state → Tier 3 (`pandacss_project`).
- New I/O or mutation → probably a new crate, not any existing one.

## Related

- [project-lifecycle](./project-lifecycle.md)
- [scope-and-boundaries](./scope-and-boundaries.md)
