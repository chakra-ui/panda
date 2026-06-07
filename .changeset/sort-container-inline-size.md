---
'@pandacss/compiler': patch
---

Sort container queries by their resolved `inline-size`, like media queries.

The cascade sorter only recognized `width`-based queries, so theme container conditions (which emit `@container (inline-size >= …)`) fell back to raw-string ordering — e.g. `inline-size >= 16rem` sorted before `inline-size >= 8rem`, inverting the mobile-first cascade. The query parser now resolves direction + length across every size axis (`width`, `inline-size`, `height`, `block-size`), in both modern (`>=`/`<`) and legacy (`min-*`/`max-*`) forms, so container breakpoints sort by magnitude.
