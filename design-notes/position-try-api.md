# `positionTry()` API

`positionTry()` names a CSS anchor-positioning fallback and returns the dashed-ident you put in
`position-try-fallbacks`. Panda emits the `@position-try` block; you reference it by the returned name.

Two inputs, same output:

- `positionTry({ top: 'anchor(bottom)', … })` — ad hoc; ident is `--pt_{hash}`
- `positionTry('bottom')` — theme / preset name; ident is `--pt_bottom`

A static call rewrites to the ident literal and drops the import. Unused theme names stay out of the CSS. There is no
generated JS map.

This is the value-referenced sibling of [`viewTransition()`](./view-transition-api.md). It exists so both anchor
fallbacks and view transitions are theme artifacts with a matching factory, rather than one living in the theme and the
other in a `globalPositionTry` side-bucket. `globalPositionTry` is removed in v2.

## Basic example

```ts
import { css, positionTry } from 'styled-system/css'

const bottom = positionTry({
  top: 'anchor(bottom)',
  insetInlineStart: 'anchor(start)',
})
// → "--pt_xxx"

css({ positionAnchor: '--trigger', positionTryFallbacks: bottom })
```

Generated CSS:

```css
@position-try --pt_xxx {
  top: anchor(bottom);
  inset-inline-start: anchor(start);
}
```

The `positionTryFallbacks: "--pt_xxx"` value flows through the normal `css()` atom path — it is an ordinary property
value once the factory has produced the ident.

## Why an ident, not a class

`viewTransition('slide')` returns a class because a view transition is attached to an element through
`view-transition-class`. An anchor fallback is not attached to an element; it is named in a property value
(`position-try-fallbacks: --pt_xxx`), the same way `@keyframes spin` is named by `animation-name: spin`. So the factory
returns the dashed-ident that the property consumes. StyleX draws the same line: its `positionTry()` returns a fallback
name, its `viewTransitionClass()` returns a class.

## Why the theme, not `globalPositionTry`

v1's `globalPositionTry` emitted every block unconditionally in the base layer, with no way to reference a block through
a factory and no tree-shaking. `theme.positionTry` makes it a design-system artifact keyed by name, alongside
`theme.keyframes` and `theme.viewTransitions`, and the compiler emits only the blocks a build uses.

`globalPositionTry` is removed. It had no factory and no tree-shaking, and the anchor fallback is authored next to the
element that uses it, so the theme + factory covers real usage. A `@position-try` that must emit unconditionally with a
hand-authored name (a dynamic fallback list, or a reference from external CSS) belongs in a plain `.css` file.

## Decisions

| Topic        | Choice                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Export       | `styled-system/css` only                                                                                              |
| Allowlist    | Css category: `["css", "cva", "sva", "viewTransition", "positionTry"]` — no dedicated key                             |
| Ident model  | Object form: `--pt_{to_hash(stableSerializedOptions)}`. Theme name: `--pt_{name}`. Optional `{prefix}-` before `pt_`. |
| Descriptors  | Flat declaration block, like `@font-face` — no slots, no selectors, no nesting                                        |
| Rendering    | Descriptor-level (`render_descriptor_value`), the same path `globalPositionTry` uses today                            |
| Layer        | Base (top-level `@position-try` at-rule)                                                                              |
| Return value | The dashed-ident string, for `position-try-fallbacks` / the `position-try` shorthand                                  |

## Hash contract

Runtime (codegen) and Rust emit must produce the same ident:

Object form:

1. Stable-serialize the whole descriptor object with sorted keys (no slot filtering — the block is flat).
2. `ident = "--pt_" + toHash(serialized)`, then apply `prefix` as `--{prefix}-pt_…`.
3. The emitted `@position-try {ident}` block uses that same finalized ident.

Theme name form: `ident = "--pt_" + name` (plus `{prefix}-`). Same block. No hash.

Both live in `pandacss_shared::position_try` next to `view_transition`, so there is one serialize/hash, not two.

## How it flows through the compiler

```
positionTry({…}) | positionTry('bottom')
  → MatchCategory::Css + name "positionTry" (css barrel)
  → Project IR (ident + descriptor Literal), keyed by (file, span)
      object: hash the descriptors
      string: resolve theme.positionTry[name] → --pt_{name}
  → transform rewrites static calls to the ident literal (dead import cleanup)
  → dynamic calls keep the codegen runtime factory
  → panda lib: BuildInfo.positionTry (+ per-module indices) for hydrate
  → StylesheetInput.position_try (used blocks only)
  → base layer: @position-try {ident} { descriptors }
```

Static object calls rewrite to `"--pt_xxx"` (plus `{prefix}-`) via `position_try_ident` — the same helper as emit.
Static `'bottom'` rewrites to `"--pt_bottom"` when that name exists in the merged theme. Fully dynamic args
(`positionTry(options)`) stay for the codegen runtime factory, same as `css(options)`. `positionTry.raw` is skipped.
Mixed files inline the static sites and keep the import when a dynamic call remains. Tests live in
`crates/pandacss_project/tests/transform/position_try.rs`.

Descriptor values feed usage marking (token refs → CSS vars) so unused-token pruning still sees them.

## Shipping from a design system

Export bags from DS source (`export const bottom = positionTry({…})`) or register named bags in `theme.positionTry`.
`panda lib` serializes them into `BuildInfo.positionTry` with per-module indices, so consumers hydrate the
`@position-try` CSS without re-scanning the library, tree-shaken by module the same way recipes and view transitions
are. Adding the hydratable payload bumped `SCHEMA_VERSION` to 6. See [build-info.md](./build-info.md).

## What we are not doing yet

- Moving `globalFontface` to `theme.fontface`. It is the last global at-rule bag referenced by a value, so it should
  follow, but it is out of scope here.
- A generated `positionTry` JS module. Static calls inline; a namespace import would bloat JS.

## Related

- [View Transition API](./view-transition-api.md) — the class-returning sibling
- [Extraction pipeline](./extraction-pipeline.md)
- [Native stylesheet compiler](./stylesheet.md)
- [Codegen design](./codegen-design.md)
- [Build info](./build-info.md)
