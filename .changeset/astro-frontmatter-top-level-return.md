---
'@pandacss/compiler': patch
---

Parse `.astro` frontmatter where a top-level `return` is valid. Astro compiles frontmatter as the body of the component's render function, so a top-level `return` (e.g. an early `return null` guard) is legal Astro. The Oxc extractor parsed the masked frontmatter as a bare module and rejected it, aborting the whole build. Such files now extract cleanly.
