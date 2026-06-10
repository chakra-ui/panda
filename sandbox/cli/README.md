# Panda CLI Sandbox

This sandbox is intentionally shaped for `packages/cli`:

- plain object `panda.config.ts`
- `include: ['src/**/*.tsx']`
- `@panda/*` import-map specifiers
- no `@pandacss/dev` `defineConfig` wrapper or old CLI hooks

Run:

```sh
pnpm --filter=./sandbox/cli dev
pnpm --filter=./sandbox/cli build
pnpm --filter=./sandbox/cli inspect
pnpm --filter=./sandbox/cli codegen
pnpm --filter=./sandbox/cli cssgen
```

There are also `v1:codegen` and `v1:cssgen` scripts that run the published npm v1 CLI for comparison.
