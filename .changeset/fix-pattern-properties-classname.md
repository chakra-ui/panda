---
'@pandacss/compiler': patch
---

Stop adding `className` to pattern property types. Pattern `*Properties` interfaces only list configured props; JSX components keep React's `className`, and pattern functions no longer emit a `class-name_*` utility class.
