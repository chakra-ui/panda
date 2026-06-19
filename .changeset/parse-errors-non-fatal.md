---
'@pandacss/compiler': patch
---

Improve parse handling during extraction.

- `.astro` frontmatter with a top-level `return` now extracts correctly.
- Files Panda can't fully parse now warn instead of aborting the build. The warning explains that some styles may be missing. Use `--max-warnings 0` if you want parse warnings to fail CI.
