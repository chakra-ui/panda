---
'@pandacss/compiler': patch
---

Stop adding `className` to pattern property types.

Pattern `*Properties` interfaces now only list configured pattern props. JSX components get React's `className` type back, and passing `className` to a pattern function no longer emits a `class-name_*` utility class.
