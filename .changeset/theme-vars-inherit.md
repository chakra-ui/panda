---
'@pandacss/compiler': patch
---

Fix theme CSS so nesting and dark mode work. Theme variables now declare on the `[data-panda-theme]` element and
inherit, instead of being re-set on every descendant.

- A `gothic` panel inside a `matcha` page now renders gothic, whichever theme comes first in the CSS.
- `<html class="dark" data-panda-theme="gothic">` now reaches every element, and `dark` toggled inside a theme works.
- On-demand theme files from `styled-system/themes` scope their dark rules to the theme.
- A nested `base` value inside a condition, such as `_dark: { base, md }`, is no longer dropped.
- Warn when a theme name contains anything but letters, digits, `-` or `_`, since it becomes a `data-panda-theme` value,
  a `_theme*` condition and the `ThemeName` type.
