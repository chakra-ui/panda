---
'@pandacss/cli': minor
---

Add `panda studio` for visualizing your design tokens.

Running `panda studio` emits `styled-system/studio` and boots a live viewer for your tokens. The generated module gives
you two framework-agnostic functions, inspired by Tiptap's `getHTML`/`getJSON`:

- `getTokenJson({ category, query })` returns your tokens as data — filter by category, search by query, and build your
  own UI by walking the result.
- `getTokenHtml({ tokens })` returns semantic, style-free HTML you can drop into any framework (`dangerouslySetInnerHTML`,
  `v-html`, `innerHTML`) and style however you like.

Semantic tokens carry their per-condition and per-theme values, resolved to real values. Panda ships the data and the
markup; the styling and any richer UI are yours.
