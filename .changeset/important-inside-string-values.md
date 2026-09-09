---
'@pandacss/compiler': patch
---

Keep `!` inside string values. `css({ content: '"hello!"' })` emitted `content: "hello" !important`; only a trailing
`!` or `!important` marks a declaration important now.
