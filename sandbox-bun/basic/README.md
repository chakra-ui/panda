# sandbox-bun/basic

A Bun fullstack app (`Bun.serve` + HTML imports) styled with the local `@pandacss/bun` plugin. It lives outside the pnpm
workspace so Bun resolves everything itself; the plugin is imported from `packages/bun/src`.

```bash
bun install
bun run dev    # dev server with HMR
bun run test   # unit + in-process dev server tests
bun run build  # production build through Bun.build (the `bun build` CLI runs no plugins)
bun run start
```
