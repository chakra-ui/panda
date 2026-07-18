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

1. **Separate files / maintainable / jsx** — the rewrite above. ✅ decided.
2. **Fix nesting** — nested semantic conditions flatten + colon-join (`_dark:_sunset`).
   **Done** (`buildSemanticMap`, commit b5214cc9). Nested paths (`brand.primary`) already worked.
3. **Semantic beyond colors** — `buildSemanticMap` already walks every category. Render
   semantic tokens grouped by category, each with its category's preview (colors→swatch,
   spacing→scale, shadows→box…), not swatch-only. Semantic view moves up the nav.
4. **Keep search on the page** — move the filter input into the content header (breadcrumb
   row), not only the sidebar.
5. **Breadcrumb** — `Tokens / Colors` on each page so the current page is clear.
6. **Shadows/semantics in both modes** — render shadow (and semantic) previews inside a
   forced-light and a forced-dark wrapper side by side, so both are always visible.
7. **Spacing/sizes** — dim the scale bar (opacity) so it is not glaring; add a sort control
   (token order / ascending / descending). Same for sizes.
8. **Playground across all categories** — one playground that composes any token category,
   plus semantic tokens and named themes.
9. **Proper panda logo** — replace the 🐼 emoji with the real Panda mark (inline SVG).
10. **Custom font + logo (v1 parity)** — read `config` for a custom logo and load the
    user's font so samples render in their typeface.

## Sequencing

Phase A (data): nesting ✅. Phase B: scaffold hono/jsx + port pages to parity behind the
existing server. Phase C: layer features 3–10 in the new structure. Ship incrementally;
keep the old viewer working until the new one reaches parity.
