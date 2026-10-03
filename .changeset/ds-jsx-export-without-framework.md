---
'@pandacss/config': patch
'@pandacss/compiler': patch
---

Apps using a `designSystem` without `jsxFramework` no longer fail codegen with `design_system_export_missing` for
`./jsx`. With `jsxFramework` set, a missing `./jsx` export is now reported even when the design system has no patterns.
