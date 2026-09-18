---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

- Transform more conditional and partially dynamic `css()` calls while preserving styles, overrides, and evaluation
  order.
- Refresh source styles, config styles, and recipes when replacing a utility transform, so generated CSS stays current.
- Apply boolean utility transforms in config styles, including `globalCss`.
- Remove imported recipe CSS when clearing a project and keep existing styles when replacement build info is invalid.
- Clear stale file-read errors after a successful retry with unchanged source.
- Keep `.raw()` object output valid in arrow bodies and statements, and select numeric recipe variants using JavaScript
  values.
