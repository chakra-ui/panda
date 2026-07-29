---
'@pandacss/compiler': patch
---

Fix arbitrary values containing a quote or backslash producing unparseable output when merged with a dynamic
`className`. `<Box className={cls} color={'[var(--x, "red")]'} />` emitted a broken string literal instead of escaping
the class name.
