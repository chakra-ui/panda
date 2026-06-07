---
'@pandacss/compiler': patch
---

Merge adjacent selectors that share an identical declaration block into one comma-joined rule (parity with the legacy engine's merge-rules pass).

The v2 native emitter now coalesces consecutive rules with the same declaration block — e.g. `css({ _hover: { color: 'red' } })` + `css({ '[data-x] &': { color: 'red' } })` emits one `.hover\:color_red:hover, [data-x] .…:color_red { color: red }` instead of two separate rules. The merge is adjacency-only (cascade-safe, mirroring lightningcss's `CssRuleList::minify`) and runs at the IR level — no CSS parser, no new dependency, identical in the native and wasm builds. It covers the atomic and globalCss layers. CSS is functionally equivalent, just smaller.
