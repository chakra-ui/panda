---
'@pandacss/compiler': patch
---

Fix a `designSystem` consumer emitting the wrong CSS property for a library utility with a JS `transform`. A `boxSize`
prop emitted `box-size` instead of `width`/`height`, because styles replayed from the library's build info skipped the
transform.
