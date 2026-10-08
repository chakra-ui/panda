# `panda studio` — open your design system in Panda Studio

## Goal

Today: run `panda codegen --spec`, find `styled-system/specs/design-system.json`, drag it onto the studio. Goal: one
command, `panda studio`, opens the hosted studio already showing your system.

Constraint (from Sage): we don't store user design systems. Private systems must be safe to send.

Success:

- `panda studio` in any Panda project opens the browser on the rendered system, no file, no drag.
- The studio server never sees a readable design system.
- Works in Chrome, Safari, Firefox, on macOS, Linux, Windows, with no browser prompt.

## Approach: encrypted relay

```
panda studio
  │  spec JSON in memory → gzip → AES-GCM with a fresh random key
  ▼
POST <studio>/api/handoff   body: ciphertext + iv
  │  server: SET handoff:<id> EX 600, returns { id }
  ▼
open <studio>/view?h=<id>#k=<key>          key is in the fragment, never sent to the server
  │
  ▼
browser: GET /api/handoff/<id> (GETDEL) → decrypt → gunzip → parseSpec → saveTokens → render
```

Same pattern as Excalidraw share links: the key lives only in the URL fragment, the server holds bytes it can't read.

### Rejected

| Option                           | Why not                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Studio fetches from `127.0.0.1`  | Chrome 142+ Local Network Access prompt; Safari blocks http localhost from https.                                                                                                                          |
| Spec in the URL fragment, no API | Sample spec is ~18 KB gzipped + base64; `cmd start` caps at 8,191 chars (a different launcher avoids it); the spec lands in browser history and pasted links. See [cli-studio-open](./cli-studio-open.md). |
| Plain relay (no encryption)      | Server would see private systems.                                                                                                                                                                          |
| CLI serves the studio UI         | We removed the bundled studio UI on purpose.                                                                                                                                                               |

## CLI — `packages/cli/src/commands/studio.ts`

```
panda studio [--cwd] [--config] [--no-open] [--json]
```

1. Load config, build the spec string in memory (no file written).
2. Encrypt and POST. On success print the URL and open it unless `--no-open`.
3. `--json` prints `{ "url": "…" }` and never opens.
4. Upload fails (offline, 4xx/5xx, payload too large): write the spec with the existing `--spec` path, print the file
   path and "drop it on <studio>", exit `1`.

Failure messages: `studio: couldn't reach <url>`, `studio: <url> rejected the upload (<status> <statusText>)`, and
`studio: nothing to show, your config has no tokens (add a preset or theme tokens)`. The upload times out after 15s.

Studio origin: `https://studio.panda-css.com` constant, overridable with `PANDA_STUDIO_URL` (for local dev and
previews).

Opening the browser: a few lines over `child_process` (`open` / `xdg-open` / `cmd /c start ""`). No new dependency.

### Driver

`DriverBase.spec()` (`packages/compiler-shared/src/driver.ts`) generates the `specs` artifact then writes it. Split out
`specJson(): string | undefined` that returns the first file's code with sources applied; `spec()` calls it then writes.
`panda studio` calls `specJson()`.

### Crypto

`@pandacss/compiler-shared` exports `sealSpec(json)` / `openSpec(sealed, key)`, used by both the CLI and the studio so
the format has one owner. Web APIs only (Node 22 has them globally): AES-GCM 256 with a 12-byte IV via `crypto.subtle`,
gzip via `CompressionStream` / `DecompressionStream`. Key and payload encoded base64url.

## Studio — `apps/studio`

- `server/api/handoff/index.post.ts` — accepts `{ iv, data }` (base64url), max 1,000,000 characters of `data`, stores in
  Redis with a 600s TTL, returns `{ id }` (`nanoid(16)`). Rejects anything else with 400/413. Rate limit: 20 handoffs per
  client per minute (429); a Vercel WAF rule is the follow-up for IP-rotating abuse.
- `server/api/handoff/[id].get.ts` — `GETDEL`; 404 when missing or expired.
- `pages/view.vue` — when `?h` and `#k` are present: fetch, decrypt, `parseSpec`, `saveTokens`, clear usage, strip `h`
  and `k` from the URL with `history.replaceState`, render. On failure show "Link expired, run `panda studio` again".
- Store: Upstash Redis through the Vercel marketplace (`UPSTASH_REDIS_REST_URL` / `_TOKEN`). Postgres `Spec` stays for
  the opt-in Share button only.
- CORS: none needed; the CLI isn't a browser.

## Relationship to cli-studio-open

This note takes a different transport for the same command. [cli-studio-open](./cli-studio-open.md) puts the
brotli-compressed spec in the URL fragment with no server. That keeps the spec off any server, but the whole spec ends
up in the URL: browser history, and anything the link is pasted into. It also has a size ceiling, and the truncated
long-URL risk that note lists as unresolved. The relay sends only ciphertext, keeps the link short and single-use, and
has no practical size ceiling. `--share` stays the existing opt-in public link flow and is not part of this command yet.

## Docs

- `website/content/docs/theming/studio.mdx` — lead with `panda studio`; keep drag-and-drop as the manual path.
- `website/content/docs/get-started/upgrading-to-v2.mdx` — the removed-commands table lists `panda studio`; reword that
  row: `--build` / `--preview` are gone, `panda studio` now opens the hosted studio.

## Out of scope

- Live reload on config change (re-upload + page poll). Add when asked.
- Analyze usage from the CLI.
- Self-hosted studio.

## Testing

- CLI: unit test that encrypt → decrypt (with the browser-side helper) round-trips a spec; command test with a stub
  server for success, upload failure fallback, `--json`, `--no-open`.
- Studio: vitest for the handoff handlers with an in-memory Redis stub (TTL, single read, size limit) and for the
  decrypt helper.
- Manual proof: `panda studio` in `sandbox/vite-ts` against `PANDA_STUDIO_URL=http://localhost:3000`, then against a
  Vercel preview; check Chrome, Safari, Firefox.

## Open

- Does `panda-studio-v2` have a Redis store attached? If not, someone with chakra-ui Vercel access adds Upstash.
