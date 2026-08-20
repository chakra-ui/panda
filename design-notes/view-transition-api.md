# `viewTransition()` API

`viewTransition()` returns one bag class and emits shared View Transition CSS through `view-transition-class`.
Panda owns that shared animation CSS. You still set unique `view-transition-name` values at runtime — React
`<ViewTransition>`, Astro `transition:name`, or vanilla.

Two inputs, same output:

- `viewTransition({ group, old, new, … })` — ad hoc; class is `vt_{hash}`
- `viewTransition('slide')` — theme / preset name; class is `vt_slide`

A static string rewrites to the class literal and drops the import. Unused theme names stay out of the CSS. There is
no generated JS map.

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
| Class model      | Object form: `vt_{to_hash(stableSerializedOptions)}`. Theme name: `vt_{name}`. Optional `prefix-`. |
| Slots            | `group`, `imagePair`, `old`, `new` → `::view-transition-{group,image-pair,old,new}`         |
| Selector grammar | `::view-transition-{pseudo}(.vt_xxx)` — not StyleX's `*.class` form                         |
| Keyframes        | `animationName` is a string (theme keyframe or custom). No nested `keyframes()` factory     |
| Slot bodies      | `SystemStyleObject`-like; lowered via the stylesheet style-object path                      |
| Layer            | Utilities                                                                                   |
| Emission         | `Target::Selector` (not `_before`-style condition nesting — that yields `.cls::before`)     |

## Hash contract

Runtime (codegen) and Rust emit must produce the same class string:

Object form:

1. Stable-serialize `{ group?, imagePair?, old?, new? }` with sorted object keys.
2. `className = "vt_" + toHash(serialized)`, then apply `prefix` like other css helpers.
3. The bag rule sets `view-transition-class` to that same finalized class string used in `::view-transition-*(.cls)`.

Theme name form: `className = "vt_" + name` (plus `prefix-`). Same bag rule. No hash.

## How it flows through the compiler

```
viewTransition({…}) | viewTransition('slide')
  → MatchCategory::Css + name "viewTransition" (css barrel)
  → Project IR (class + per-slot Literals)
      object: hash the slots
      string: resolve theme.viewTransitions[name] → vt_{name}
  → transform rewrites static calls to a string literal (dead import cleanup)
  → dynamic calls keep the codegen runtime factory
  → panda lib: BuildInfo.viewTransitions (+ per-module indices) for hydrate
  → StylesheetInput.view_transitions
  → utilities layer: .cls { view-transition-class } + ::view-transition-*(.cls) rules
```

Static object-literal calls rewrite to `"vt_xxx"` (plus `prefix-`) via `view_transition_class_name` — the same helper as
encode/emit. Static `'slide'` rewrites to `"vt_slide"` when that name exists in the merged theme. Fully dynamic args
(`viewTransition(options)`) stay for the codegen runtime factory, same as `css(options)`. The factory also maps a string
to `vt_{name}` so types match if transform did not run. Mixed files inline the static sites and keep the import when a
dynamic call remains. Tests live in `crates/pandacss_project/tests/transform/view_transition.rs`.

### Shipping from a design system

Export shared bags from DS source (`export const slide = viewTransition({…})`). `panda lib` serializes them into build
info so consumers hydrate the CSS without re-scanning the library. Tree-shake follows module/`only` like recipes.

Presets and `panda.config` can also register named bags in `theme.viewTransitions`. Apps call `viewTransition('slide')`.
The compiler resolves the name against the merged theme, inlines `vt_slide`, and emits that bag only when used. See
[build-info.md](./build-info.md).

Slot styles feed usage marking (`animation` / `animationName` → keyframes, token refs → CSS vars) so unused-keyframe /
unused-token pruning still sees them.

## What we are not doing yet

- View-transition types as Panda conditions (`_viewTransitionForwards`, …)
- Nested `keyframes()` helper inside options
- Setting `view-transition-name` for you
- StyleX's `*.class` functional-pseudo argument form
- A `viewTransition` field on config recipes (compose in the app; React wants the class on `enter` / `exit` / `share`)
- A generated `viewTransitions` JS module (static `viewTransition('slide')` inlines; a namespace import would bloat JS)

## Related

- [Extraction pipeline](./extraction-pipeline.md)
- [Atomic encoding](./atomic-encoding.md)
- [Native stylesheet compiler](./stylesheet.md)
- [Codegen design](./codegen-design.md)
- [Virtual styled-system](./virtual-styled-system.md)
- [Build info](./build-info.md)
- OSS-2365
