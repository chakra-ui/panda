---
title: CLI Studio Open
status: proposed
scope:
  - packages/cli
  - apps/studio
  - packages/compiler-shared
---

# CLI Studio Open

## Summary

`panda studio` opens the hosted Studio with this project's design system already loaded. It compresses
`styled-system/specs/design-system.json` into the URL fragment, so the spec never reaches a server and no account,
upload or certificate is involved. `--share` is the opt-in that posts to Studio's existing API and returns a public
link.

## Problem

Studio can already render a design system, but only if you find the file and drag it in. The spec lives at a path most
people never open, and the format is a normalized index rather than something readable, so "look at my tokens" costs
more steps than it should.

## Why not a local server

Two prior-art options exist, and both are a poor fit.

**Drizzle Studio** runs a server on `127.0.0.1:4983` that the hosted app reaches into. It works, but their docs require
Safari and Brave users to `install mkcert and generate self-signed certificate` first, because those browsers refuse an
HTTPS page reaching `http://localhost`. Chromium still has an open issue for the WebSocket variant of the same problem.

**Stately Inspector** relays over `ws://localhost:8080` into `https://stately.ai/inspect`.

Both need a live connection because their data is live: a database, a stream of state transitions. Panda's spec is a
static file that changes only when codegen runs. A server would add a process, a port, and a browser-compatibility tax
to serve a file already sitting on disk.

## Transport

Brotli, then base64url, in the fragment. A fragment is never transmitted ([RFC 3986 §3.5]), so no server sees the spec
and nginx's and Apache's request-line caps never apply. base64url's alphabet needs no percent-encoding, unlike base64's
`+ / =`.

```
https://studio.panda-css.com/view#spec=<brotli+base64url>
```

Measured on real codegen output:

| scenario                                     | raw    | gzip+b64 | brotli+b64 | % of Safari's 80k |
| -------------------------------------------- | ------ | -------- | ---------- | ----------------- |
| presets only                                 | 110 KB | 18.4 KB  | 11.8 KB    | 14.7%             |
| large: 132 colors, 300 semantic, 120 recipes | 255 KB | 29.1 KB  | 16.1 KB    | 20.1%             |
| huge: 660 colors, 1500 semantic, 600 recipes | 851 KB | 67.7 KB  | 31.6 KB    | 39.5%             |

Safari's 80,000 characters is the binding limit; Chrome allows 2 MB and Firefox is effectively unbounded. Brotli is
required rather than preferred: at the huge scale gzip reaches 85% of Safari's limit while brotli sits at 40%. Design
systems are repetitive, so brotli's lead widens as they grow.

Extrapolated, the limit lands near 2 MB of raw spec. Encode first and check the final URL length — compression ratio
varies with how repetitive the tokens are, so raw size predicts it poorly. Past ~60,000 characters, refuse to open and
point at `--share`, which has no size limit because it sends a body.

## Command shape

```
panda studio                # open the hosted viewer, spec in the fragment
panda studio --share        # upload, open the public /s/<slug> link
panda studio --analyze      # attach a usage report, open /a/<slug>
```

Plus the shared `--cwd` / `--config` set.

`--share` posts to `POST /api/specs`, which already exists, already validates `schemaVersion` and `paths`, and already
accepts a `usage` payload.

`--analyze` sends the report `panda analyze` produces. Both sides already build the same value: Studio's precise tier
calls `createUsageReport(batch, { scope: 'all', spec: compiler.spec() })` in `apps/studio/utils/analyze-compiler.ts`,
and the CLI calls the same function. Studio only recomputes because it has no way to receive a report. Handing it one
means the precise tier no longer needs the compiler in the browser, or the user's `panda.config.ts` dropped into a web
page.

## Uploading is opt-in

`POST /api/specs` creates a public, permanent, unauthenticated URL. A design system is often unreleased brand work.
Uploading it because someone ran a bare command is the version of this that becomes an incident, whatever the slug's
entropy. The default keeps the spec on the machine; `--share` says plainly that it is creating a public link.

Stately reaches the same conclusion from the other direction: it ships `sanitizeEvent` and `sanitizeContext` hooks
because data leaving the process is a decision, not a detail.

## Work

- **Studio** — `/view` reads `#spec=`, decompresses, hands the result to the loader the drop handler already uses.
  Nothing works before this.
- **CLI** — a `studio` command, plus an open-browser helper the package doesn't have yet.
- **Staleness** — a spec older than the config renders yesterday's tokens, which fails confusingly. Compare mtimes and
  regenerate, the way the `--check` flows already reason about staleness. This also covers the case where the spec is
  opt-in and was never generated, so making it opt-in costs nothing at the point of use.
- **Depends on how the spec is published.** [Discussion #3795] proposes `panda spec` writing `<outdir>/specs/spec.json`,
  with default publication listed as an open decision. v1 shipped `panda spec` as a dedicated command and codegen never
  wrote spec files; v2 emits `specs/design-system.json` as an unconditional codegen artifact. That question should be
  settled before this command hardens around either answer.

[discussion #3795]: https://github.com/chakra-ui/panda/discussions/3795

## The spec and the usage report stay separate

Studio's share payload is `{ spec, usage }`, which makes it tempting to have one command emit both. [Discussion #3809]
argues against it, and is right to: resolved definitions change when config changes, project usage changes when any
source file changes. They have different owners and different invalidation triggers, so fusing them in a command's
output couples two artifacts that should move independently.

`panda spec` emits definitions. `panda analyze` emits usage. This command joins them at the edge, where the joining is a
transport concern rather than a modelling one. The same JSON reaches Studio either way; the commands stay separable.

[discussion #3809]: https://github.com/chakra-ui/panda/discussions/3809

## Relationship to `cli-studio-generate`

[`cli-studio-generate`](./cli-studio-generate.md) proposes `panda studio` as a local vanilla-JS viewer served over
`node:http`. That predates the hosted Studio, which now covers viewing, usage analysis and sharing. This note takes the
`panda studio` name for opening the hosted app; the local viewer track should be dropped rather than shipped alongside
it.

`panda studio generate`, which emits view components into the user's project, is unaffected and still worth building.
That note also describes a `tokens.json` snapshot that no longer exists — codegen writes `specs/design-system.json`,
read through `parseDesignSystem` and `indexDesignSystem`.

## Unresolved Questions

- Whether a fragment survives every path a link takes: chat clients and issue trackers sometimes truncate or rewrite
  long URLs, and a truncated fragment fails silently rather than loudly.
- Whether `--share` should print what it is about to upload, or a summary, before doing it.

## Related

- [cli-studio-generate](./cli-studio-generate.md)
- [cli-analyze](./cli-analyze.md)
- [design-system-spec](./design-system-spec.md)
- [cli-design-md](./cli-design-md.md)
- [Discussion #3795](https://github.com/chakra-ui/panda/discussions/3795) — versioned spec, `panda spec`, default
  publication
- [Discussion #3809](https://github.com/chakra-ui/panda/discussions/3809) — definitions vs usage vs output request

[rfc 3986 §3.5]: https://www.rfc-editor.org/rfc/rfc3986#section-3.5
