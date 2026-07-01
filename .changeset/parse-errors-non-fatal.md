---
'@pandacss/compiler': patch
---

Improve parse handling during extraction.

`.astro` frontmatter with a top-level `return` now extracts correctly. Files Panda can't fully parse now warn instead of
aborting the build; use `--max-warnings 0` to fail CI on parse warnings.
