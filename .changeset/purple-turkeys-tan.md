---
'@pandacss/preset-base': major
---

- Fix issue where `rtl` and `ltr` variants does not work with `[dir=auto]`
- Add `::-webkit-details-marker` to `marker` condition
- Add new `inset-2xs`, `inset-xs` and `inset-sm` shadows
- Add new `noscript` and `inverted-colors` conditions
- Add `:popover-open` to `open` condition
- Removed `inner` shadow in favor of `inset-sm`
- Remap blur tokens:
  - `blurs.sm` -> `blurs.xs`
  - `blurs.base` -> `blurs.sm`
