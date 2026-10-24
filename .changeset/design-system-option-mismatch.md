---
'@pandacss/compiler': patch
---

Clarify the `design_system_option_mismatch` warning: components from a design system render unstyled when your app sets
a different `prefix`, `hash`, or `separator`. Leave them unset to inherit the design system's.
