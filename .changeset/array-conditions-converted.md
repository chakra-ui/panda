---
'@pandacss/compiler': patch
---

Convert v1 array conditions (`hover: ['@media (hover: hover)', '&:hover']`) to the `@slot` object form with a warning,
instead of failing to load the config.
