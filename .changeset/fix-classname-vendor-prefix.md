---
'@pandacss/compiler': patch
---

Fix cssgen dropping the leading dash on vendor-prefixed property names, so the class (and the CSS property) never matched the runtime.

A vendor-prefixed property is authored PascalCase — `WebkitBackgroundClip`, `WebkitTextFillColor`, `MozAppearance`. The runtime `css()` hyphenates these with `property.replace(/[A-Z]/g, "-$&").toLowerCase()`, which prepends a dash to *every* uppercase including the first → `-webkit-background-clip`, and names the class `-webkit-background-clip_text`. The native engine's `hyphenate_property` suppressed the dash on the first letter (`index > 0`), producing `webkit-background-clip` — so cssgen wrote `.webkit-background-clip_text { webkit-background-clip: text }`, a class the runtime never emits *and* an invalid (de-prefixed) CSS property. The gradient-text pattern (`WebkitBackgroundClip: 'text'` + `WebkitTextFillColor: 'transparent'`) silently did nothing.

`hyphenate_property` now prepends the dash to every uppercase letter (matching the runtime and legacy Panda's `wordRegex`/`/[A-Z]/g`), so `WebkitBackgroundClip` → `-webkit-background-clip` and `MozAppearance` → `-moz-appearance`. camelCase props are unchanged (`backgroundColor` → `background-color`), and the `msTransform` → `-ms-transform` special case is preserved.
