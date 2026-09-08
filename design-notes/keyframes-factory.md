# `keyframes()` API

`keyframes()` names an inline `@keyframes` block and returns the animation name to put in `animationName` (or the
`animation` shorthand). It exists so an ad-hoc, component-local animation does not have to live in `theme.keyframes`.

```ts
import { css, keyframes } from 'styled-system/css'

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})
// → "kf_xxx"

css({ animation: `${spin} 1s linear infinite` })
```

```css
@keyframes kf_xxx {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

A static call inlines to the name and drops the import. Unused inline keyframes stay out of the CSS, the same way
`theme.keyframes` are pruned by `removeUnusedKeyframes`.

## Object form only

Unlike [`viewTransition()`](./view-transition-api.md) and [`positionTry()`](./position-try-api.md), `keyframes()` has
**no named form**. `animationName: 'spin'` already resolves a `theme.keyframes` entry and tree-shakes, so a
`keyframes('spin')` factory would be pure redundancy. The factory takes an object and only an object.

`theme.keyframes`, `defineKeyframes`, and bare-name references are unchanged. The factory is additive, for the inline
case those cannot express.

## What it is not

- Not a replacement for `theme.keyframes`. Shared, design-system animations still belong in the theme.
- Not the `strictTokens` keyframe-name typing gap (a bare `animationName: 'spin'` needing `'[spin]'` under
  `strictTokens`). That is a separate typing bug, tracked on its own.

## Decisions

| Topic         | Choice                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Export        | `styled-system/css` only                                                                        |
| Allowlist     | Css category: `["css", "cva", "sva", "viewTransition", "positionTry", "keyframes"]`             |
| Name model    | `kf_{to_hash(stableSerializedStops)}`, optional `{prefix}-`. No named form.                       |
| Stops         | `from` / `to` / `<percentage>` keys, each a `SystemStyleObject`, same shape as `theme.keyframes` |
| Emission      | Merged with `theme.keyframes` into the existing `serialize_keyframes`, tokens layer             |
| Tree-shaking  | The folded name appears in `animationName`; the existing `usage.keyframes` filter keeps it       |
| Return value  | The animation-name string, for `animationName` or the `animation` shorthand                      |

## Hash contract

Runtime (codegen) and Rust emit must produce the same name:

1. Stable-serialize the whole stops object with sorted keys (shared `pandacss_shared::stable_stringify`).
2. `name = "kf_" + toHash(serialized)`, then apply `prefix` as `{prefix}-kf_…`.
3. The emitted `@keyframes {name}` block uses that same finalized name.

Lives in `pandacss_shared::keyframes` next to `position_try` / `view_transition`.

## How it flows through the compiler

```
keyframes({…})
  → MatchCategory::Css + name "keyframes" (css barrel)
  → value fold: keyframes({…}) → "kf_{hash}" wherever it is used (like positionTry)
  → Project IR (name + stops Literal), keyed by (file, span)
  → transform rewrites static calls to the name literal (dead import cleanup)
  → dynamic calls keep the codegen runtime factory
  → panda lib: BuildInfo.keyframes (+ per-module indices) for hydrate
  → StylesheetInput.inline_keyframes → merged with theme.keyframes → serialize_keyframes (tokens layer)
```

The value fold reuses the `positionTry` path: a `keyframes({…})` call folds to its name string in any value slot, so
`animationName: keyframes({…})` and `animation: `${spin} 1s`` both emit real declarations. The `@keyframes` block is
emitted from the call being extracted, tree-shaken because the folded name shows up in `animationName` and feeds the
existing `usage.keyframes` set.

### Shipping from a design system

`export const spin = keyframes({…})` serializes into build info, so consumers get the `@keyframes` CSS without
re-scanning the library, tree-shaken by module like recipes. Or keep shared animations in a preset's `theme.keyframes`
and reference them by name.

## What we are not doing yet

- A named `keyframes('spin')` form (redundant with bare-name references).
- Fixing the `strictTokens` keyframe-name typing (separate).

## Related

- [Position Try API](./position-try-api.md) — the value-fold pattern this reuses
- [View Transition API](./view-transition-api.md)
- [Native stylesheet compiler](./stylesheet.md) — keyframe emission and tree-shaking
- [Build info](./build-info.md)
- Discussions [#805](https://github.com/chakra-ui/panda/discussions/805), [#1391](https://github.com/chakra-ui/panda/discussions/1391)
