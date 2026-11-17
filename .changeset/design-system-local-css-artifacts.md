---
'@pandacss/config': patch
---

Fix design system patterns and recipes ignoring your app's conditions, breakpoints, utilities, or tokens. When your
config adds any of these, codegen now generates the design system's patterns, recipes, and JSX components locally so
they use your `css`, instead of re-exporting copies that call the design system's own.
