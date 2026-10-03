---
'@pandacss/config': patch
'@pandacss/compiler': patch
---

Apps using a `designSystem` without `jsxFramework` no longer fail codegen with `design_system_export_missing` for
`./jsx`. The `./jsx` exports are only required when JSX is enabled.
