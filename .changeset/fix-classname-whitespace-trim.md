---
'@pandacss/compiler': patch
---

Fix cssgen keeping surrounding whitespace in the class name for non-`!important` values, so the class never matched the runtime.

The runtime `css()` names the class from `withoutSpace(withoutImportant(value))`, and `withoutImportant` always `.trim()`s — so `css({ padding: '0 auto ' })` is labelled `p_0_auto`. The native engine's `class_name_value` only relied on `split_important`'s trim, which (unlike the runtime's unconditional `.trim()`, added in the `!important` fix) skips trimming when there is no `!important` marker. cssgen therefore wrote `.p_0_auto_` — a class the runtime never emits — and the style silently did nothing for any value with leading/trailing whitespace.

`class_name_value` now trims before `withoutSpace`, matching the runtime and legacy Panda. `!important` values were already trimmed by the marker strip, so they are unaffected.
