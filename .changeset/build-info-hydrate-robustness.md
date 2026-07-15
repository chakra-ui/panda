---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/config': patch
---

Harden design-system build-info hydration against silent-wrong and crashing failure modes:

- `panda lib` no longer embeds a hydrated parent's atoms in a middle package's own artifact; a published artifact carries only that package's own extraction.
- A corrupt build-info (an out-of-range intern index that would silently drop atoms/recipes) is now treated as incompatible, so the consumer re-extracts from `files` instead of hydrating partial CSS.
- A structurally invalid build-info that still parses as JSON no longer crashes config load; it falls back to re-extraction.
- A version/schema-skewed layer now re-extracts from its `files` instead of hard-failing the whole build.
- A consumer that overrides `hash`/`prefix`/`separator` away from the design system now gets a warning, since the design system's prebuilt class names won't match.
