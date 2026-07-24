# `viewTransition()` API

`viewTransition()` returns one hashed bag class and emits shared View Transition CSS through `view-transition-class`.
Panda owns that shared animation CSS. You still set unique `view-transition-name` values at runtime — React
`<ViewTransition>`, Astro `transition:name`, or vanilla.

## Basic example

```ts
import { viewTransition } from 'styled-system/css'

const slide = viewTransition({
  group: {
    animationDuration: '0.4s',
    animationTimingFunction: 'ease-in-out',
  },
  imagePair: { isolation: 'isolate' },
  old: { animationName: 'slideOutLeft' },
  new: { animationName: 'slideInRight' },
})
// → "vt_xxx"
```

Generated CSS:

```css
.vt_xxx {
  view-transition-class: vt_xxx;
}

::view-transition-group(.vt_xxx) {
  animation-duration: 0.4s;
  animation-timing-function: ease-in-out;
}
::view-transition-image-pair(.vt_xxx) {
  isolation: isolate;
}
::view-transition-old(.vt_xxx) {
  animation-name: slideOutLeft;
}
::view-transition-new(.vt_xxx) {
  animation-name: slideInRight;
}
```

## Why we use `view-transition-class`

`view-transition-name` must be unique per element. Duplicates break the transition, so Panda can't extract or share it.
`view-transition-class` is the shared styling hook — like a CSS class — so it can be deduplicated. Same idea as StyleX's
`viewTransitionClass()`.

## Decisions

| Topic            | Choice                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Export           | `styled-system/css` only (object syntax; skipped for template-literal)                      |
| Allowlist        | Css category: `["css", "cva", "sva", "viewTransition"]` — no dedicated `importMap` key      |
| Class model      | One bag class `vt_{to_hash(stableSerializedOptions)}` (+ optional `config.prefix`)          |
| Slots            | `group`, `imagePair`, `old`, `new` → `::view-transition-{group,image-pair,old,new}`         |
| Selector grammar | `::view-transition-{pseudo}(.vt_xxx)` — not StyleX's `*.class` form                         |
| Keyframes        | `animationName` is a string (theme keyframe or custom). No nested `keyframes()` factory     |
| Slot bodies      | `SystemStyleObject`-like; lowered via the stylesheet style-object path                      |
| Layer            | Utilities                                                                                   |
| Emission         | `Target::Selector` (not `_before`-style condition nesting — that yields `.cls::before`)     |

## Hash contract

Runtime (codegen) and Rust emit must produce the same class string:

1. Stable-serialize `{ group?, imagePair?, old?, new? }` with sorted object keys.
2. `className = "vt_" + toHash(serialized)`, then apply `prefix` like other css helpers.
3. The bag rule sets `view-transition-class` to that same finalized class string used in `::view-transition-*(.cls)`.

## How it flows through the compiler

```
viewTransition({…})
  → MatchCategory::Css + name "viewTransition" (css barrel)
  → Project IR (class + per-slot Literals)
  → transform rewrites static calls to a string literal (dead import cleanup)
  → dynamic calls keep the codegen runtime factory
  → panda lib: BuildInfo.viewTransitions (+ per-module indices) for hydrate
  → StylesheetInput.view_transitions
  → utilities layer: .cls { view-transition-class } + ::view-transition-*(.cls) rules
```

Static object-literal calls rewrite to `"vt_xxx"` (plus `prefix-`) via `view_transition_class_name` — the same helper as
encode/emit. Fully dynamic args (`viewTransition(options)`) stay for the runtime factory, same as `css(options)`. Mixed
files inline the static sites and keep the import when a dynamic call remains. Tests live in
`crates/pandacss_project/tests/transform/view_transition.rs`.

### Shipping from a design system

Export shared bags from DS source (`export const slide = viewTransition({…})`). `panda lib` serializes them into build
info so consumers hydrate the CSS without re-scanning the library. Tree-shake follows module/`only` like recipes. There
is no `theme.viewTransitions` registry — same authoring model as shared `cva` / `css` helpers. See
[build-info.md](./build-info.md).

Slot styles feed usage marking (`animation` / `animationName` → keyframes, token refs → CSS vars) so unused-keyframe /
unused-token pruning still sees them.

## What we are not doing yet

- View-transition types as Panda conditions (`_viewTransitionForwards`, …)
- Nested `keyframes()` helper inside options
- Setting `view-transition-name` for you
- StyleX's `*.class` functional-pseudo argument form

## Related

- [Extraction pipeline](./extraction-pipeline.md)
- [Atomic encoding](./atomic-encoding.md)
- [Native stylesheet compiler](./stylesheet.md)
- [Codegen design](./codegen-design.md)
- [Virtual styled-system](./virtual-styled-system.md)
- [Build info](./build-info.md)
- OSS-2365
