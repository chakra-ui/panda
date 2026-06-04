# Panda v2 CLI Sandbox

This sandbox is intentionally shaped for `packages/cli_v2`:

- plain object `panda.config.ts`
- `include: ['src/**/*.tsx']`
- `@panda/*` import-map specifiers
- no `@pandacss/dev` `defineConfig` wrapper or old CLI hooks

Run:

```sh
pnpm --filter=./sandbox/cli-v2 dev
pnpm --filter=./sandbox/cli-v2 build
pnpm --filter=./sandbox/cli-v2 v2:inspect
pnpm --filter=./sandbox/cli-v2 v2:codegen
pnpm --filter=./sandbox/cli-v2 v2:cssgen
```

There are also `old:codegen` and `old:cssgen` scripts for comparison.
