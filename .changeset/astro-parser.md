---
'@pandacss/compiler': patch
---

Panda now reads `.astro` files the way Astro's own parser does, so files Astro builds are no longer dropped: shorthand
attributes, HTML comments and unclosed tags inside expressions, and a `---` or `<script>` inside frontmatter strings and
comments all extract. `css()` calls in client `<script>` blocks now get their CSS too.
