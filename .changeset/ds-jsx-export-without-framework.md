---
'@pandacss/config': patch
'@pandacss/compiler': patch
---

Fixed issue where `panda codegen` failed with `design_system_export_missing` for `./jsx` when using a `designSystem`
without `jsxFramework`.
