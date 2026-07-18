---
title: Studio v2 — maintainable viewer
status: in-progress
scope:
  - packages/cli
---

# Studio v2 — maintainable viewer

## Why

The live viewer is authored as ~1000 lines of string templates in `studio-codegen.ts`
(`VIEWER_HTML`, `VIEWER_CSS`, `VIEWER_JS`). No syntax highlighting, no type-checking
inside the strings, escaping hell. This note rewrites the viewer into real source files
and adds the features in the Studio v2 brief.

The `generate` track (React/Solid component source in the user's project) is a separate
concern and stays as-is for now.

## Architecture decision — hono/jsx, build-time SSR

Considered `vite-node` vs `hono`. `vite-node` runs TS in node; serving a browser app the
Vite way means a dev server + bundler — heavy for a token viewer. **hono/jsx** gives a
lightweight JSX runtime that renders to an HTML string with no client bundler.

- **Pages/components** authored as `.tsx` under `src/studio/`, using `hono/jsx`.
- **Render to static HTML** at request/generate time; keep the existing `node:http`
  static server (`studio-server.ts`). No new runtime server framework needed.
- **Interactivity** (theme toggle, search, playground, contrast) lives in one real
  `studio/client.ts`, compiled by tsup to a `studio-client.js` asset. Not a string blob.
- **CSS** is a real `studio/styles.css` file shipped as an asset — the "separate css
  files" ask. Per-page/section CSS can split further if it grows.
- Data functions (`buildTokensSnapshot`, `buildSemanticMap`, `keyframesToCss`) are reused
  unchanged — they are framework-agnostic and already survive this rewrite.

tsup: enable `jsxImportSource: 'hono/jsx'`, add the client entry, copy the css asset.
Adds one small dep (`hono`).

## File layout

```
src/studio/
  data.ts        # re-exports the existing snapshot/semantic/keyframes helpers
  views.ts       # the view model (categories, semantic, playground) — one source of truth
  render.tsx     # page shell + renderPage(view) -> html string
  pages/         # ColorsPage, ScalePage, SemanticPage, PlaygroundPage, ...
  components/    # Sidebar, Breadcrumb, Swatch, ScaleRow, Card, ThemeToggle, Logo
  client.ts      # interactivity -> compiled to studio-client.js
  styles.css     # -> shipped as asset
```

## Goal → task map

1. **Separate files / maintainable / jsx** — the rewrite above. Decided; not yet built.
2. **Fix nesting** — ✅ done (b5214cc9). Nested conditions flatten + colon-join
   (`_dark:_sunset`); nested paths (`brand.primary`) already worked.
3. **Semantic beyond colors** — ✅ done (569646b2). Grouped by category, swatches for
   colors, plain values for the rest; semantic view moved up to nav #2.
4. **Keep search on the page** — pending. Intent unclear: prominent content-header search
   vs preserving the query across page navigation. Needs a call.
5. **Breadcrumb** — ✅ done (f32d3fd5). `Tokens / <page>` in the content header.
6. **Shadows/semantics in both modes** — ✅ shadows done (eb5349ac): each shadow on a
   forced-light and forced-dark cell. Semantic forced-wrappers folded into #3's grouping.
7. **Spacing/sizes** — ✅ done (518444cc). Dimmed bar + ascending/descending/token sort.
8. **Playground across all categories** — pending. Large; best built in the Phase B rewrite.
9. **Proper panda logo** — ✅ done (f9b7ccfa). Official Panda P mark, `currentColor`.
10. **Custom font + logo (v1 parity)** — pending. Fonts: read `config.globalFontface` and
    emit `@font-face` so samples use the user's font. Logo: v2 has no `studio.logo` config;
    needs a new config surface (decision required).

## Sequencing

Phase A (data): nesting ✅. Several UI wins (3, 5, 6, 7, 9) shipped in the current viewer.
Phase B: scaffold hono/jsx + port pages to parity behind the existing server, then build
the playground (8) and search (4) there. Ship incrementally; keep the old viewer working
until the new one reaches parity.
