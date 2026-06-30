# Design system sandbox

Manual smoke test for `designSystem`.

## Run it

```sh
pnpm --dir sandbox-design-system test
```

This runs:

```sh
pnpm -w build:fast
pnpm --dir sandbox-design-system build
```

For local iteration after the repo packages are built:

```sh
pnpm --dir sandbox-design-system build
```

For watch mode:

```sh
pnpm --dir sandbox-design-system dev
```

Check that the design-system package contains:

- `styled-system/`
- `panda.lib.json`
- `panda.buildinfo.json`
- `preset.mjs`

The app should build and print a `design_system_token_conflict` warning for `colors.brand`. The app token wins.

## Check stale build info

After `pnpm --dir sandbox-design-system test`, edit:

```txt
sandbox-design-system/packages/ds/dist/panda.buildinfo.json
```

Set `schemaVersion` to `999`, then run:

```sh
pnpm --filter @sandbox/app build
```

The app should warn and re-extract the design-system files listed in `panda.lib.json`.
`panda lib` infers those fallback files from the source files it parsed.
