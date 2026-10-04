---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed styles going missing in Astro, Svelte and Vue files when the markup uses syntax Panda didn't read correctly, such
as a regex or comment inside an expression. `css()` calls in Astro client `<script>` blocks now get their CSS too.
