---
'@pandacss/extractor': patch
---

Fix static extraction of inline style objects from compiled JSX calls.

Panda's extractor now recognizes compiled JSX factory calls (`jsx`, `_jsx`, `jsxs`, `_jsxs`, `createElement`) and
extracts inline style props from the second argument. Previously, styles passed as inline object literals in compiled
output (e.g. `jsx(Box, { css: { color: "red.900" } })`) were silently dropped because the extractor only handled
JSX element syntax, not the equivalent call expression form produced by bundlers.
