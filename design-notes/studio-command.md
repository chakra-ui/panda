# `panda studio` — open your design system in Panda Studio

## Goal

Today: run `panda codegen --spec`, find `styled-system/specs/design-system.json`, drag it onto the studio. Goal: one
command, `panda studio`, opens the hosted studio already showing your system.

Constraints: we don't store user design systems, and we don't pay for a service to move them.

## Approach: spec in the URL fragment

This is the transport from [cli-studio-open](./cli-studio-open.md), with gzip instead of brotli.

```
panda studio
  │  spec JSON in memory → gzip → base64url
  ▼
open <studio>/view#spec=<encoded>          the fragment is never sent to a server
  │
  ▼
browser: decode → gunzip → parseSpec → saveTokens → strip the fragment → render
```

Studio serves static pages for this flow. No API route, no storage, no rate limiting.

### Why gzip, not brotli

The browser has to decompress with `DecompressionStream`. Chromium doesn't support `'brotli'` there (checked on 149), so
brotli would mean shipping a decoder in Studio. gzip works natively everywhere and in Node 22.

### Size

gzip + base64url is roughly 1.8× the brotli sizes measured in cli-studio-open: about 18 KB for presets only and 68 KB
for the "huge" system (660 colors, 1,500 semantic tokens, 600 recipes). The CLI refuses links over 80,000 characters,
Safari's documented ceiling, and falls back to writing the spec file with "drop it on <studio>". Navigating to a 1.5 MB
fragment worked in both Chromium and WebKit under Playwright, so the cap is conservative.

### Opening the browser

`open` (macOS) and `xdg-open` (Linux) take the long URL as an argument. Windows `cmd /c start` caps the command line at
8,191 characters, so on Windows the CLI writes `<tmpdir>/panda-studio.html`, which redirects to the URL, and opens that
file instead.

### Rejected

| Option                          | Why not                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| Encrypted relay through Redis   | Needs a paid store and a deploy-order dependency for a file the browser can carry itself. |
| Studio fetches from `127.0.0.1` | Chrome 142+ Local Network Access prompt; Safari blocks http localhost from https.         |
| CLI serves the studio UI        | We removed the bundled studio UI on purpose.                                              |

## CLI — `packages/cli/src/commands/studio.ts`

```
panda studio [--cwd] [--config] [--no-open] [--json] [--watch]
```

1. Load config, build the spec string in memory (`driver.specJson()`, no file written).
2. Encode it into `<studio>/view#spec=…`. Open it unless `--no-open`; print `studio: opened <studio> in your browser`.
3. `--no-open` prints the link. `--json` prints `{ "url": "…" }` and never opens.
4. Over 80,000 characters: write the spec with the existing `--spec` path, print the file path and "drop it on
   <studio>", exit `1`.

Studio origin: `https://studio.panda-css.com`, overridable with `PANDA_STUDIO_URL` for local dev and previews.

`@pandacss/compiler-shared` exports `encodeSpec(json)` / `decodeSpec(value)`, used by both the CLI and Studio so the
format has one owner.

## Studio — `apps/studio/pages/view.vue`

When `#spec=` is present: decode, `parseSpec`, `saveTokens`, `router.replace` to `/view`, render. This runs in
`onNuxtReady`, not `onMounted`: `/view` is prerendered, and Nuxt's router replays the initial URL during hydration,
which would undo an earlier URL change and remount the page. A reload reads from IndexedDB like a dropped file. If
decoding or parsing fails, show "This link is incomplete" with the command to copy and a link back to the drop page.
gzip's checksum makes a truncated link fail loudly instead of rendering a partial system.

## Watch — `packages/cli/src/studio-watch.ts`

```
panda studio --watch
  │  serve http://127.0.0.1:<port>          page = full-size iframe of <studio>/view
  │  GET /events (SSE)                      current spec, then one event per config change
  ▼
local page ──postMessage({ type: 'panda-studio:spec', json })──▶ framed /view
```

- The local page reads events from its own origin, so there's no cross-site request to `localhost` and no Local Network
  Access prompt. It hands each spec to the iframe with `postMessage`, targeting Studio's origin.
- A framed `/view` skips the fragment and IndexedDB paths. It posts `panda-studio:ready` to its parent on mount and
  renders each spec it receives. It accepts messages only from `window.parent` on an `http://127.0.0.1:*` or
  `http://localhost:*` origin.
- Config changes go through `startProjectWatch` and `driver.reload()`, the same path as `codegen --watch`. Source
  changes are ignored; the spec only depends on config.
- Studio's prerendered pages send no CSP, so nothing blocks the iframe. If a `frame-ancestors` policy is added to
  `/view` later, it must allow those two loopback origins.

## Trade-offs

- The full spec is in the link, so it lands in local browser history and anywhere the link is pasted. Studio strips it
  from the address bar after loading.
- Systems past the cap use the file fallback.

## Out of scope

- `--share` (public `/s/<slug>` link through the existing `POST /api/specs`) and `--analyze`.

## Testing

- `compiler-shared`: encode/decode round-trip, base64url alphabet, truncated and invalid input reject.
- CLI: link shape and decoded content match `panda codegen --spec`, `--json`, `--no-open`, too-large fallback, empty
  config.
- Studio: fragment parsing and decode failure.
- CLI watch: served page frames `/view`, `/events` streams the spec, a config change pushes an update.
- Studio: watch messages only accepted from a loopback parent.
- Manual: `panda studio` and `panda studio --watch` in `sandbox/vite-ts` against a production build of Studio
  (`PANDA_STUDIO_URL=http://localhost:3000`), in Chromium and WebKit.
