# Design system sandbox

Manual smoke test for React Vite apps consuming Panda design-system packages.

```txt
@sandbox/ds
  -> @sandbox/app

@sandbox/foundations
  -> @sandbox/ds-nested
    -> @sandbox/app-nested
```

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

For the nested chain:

```sh
pnpm --dir sandbox-design-system dev:nested
```

Check that each design-system package contains:

- `packages/foundations/dist/panda.lib.json`
- `packages/ds/dist/panda.lib.json`
- `packages/ds-nested/dist/panda.lib.json`
- `styled-system/`
- `panda.lib.json`
- `panda.buildinfo.json`
- `preset.mjs`

`@sandbox/app` tests the simple React Vite consumer path. `@sandbox/app-nested` tests the React Vite consumer path for a
nested design-system chain. Both apps override `colors.brand`, so each should print a `design_system_token_conflict`
warning. The app token wins.

## Check stale build info

After `pnpm --dir sandbox-design-system test`, edit:

```txt
sandbox-design-system/packages/ds-nested/dist/panda.buildinfo.json
```

Set `schemaVersion` to `999`, then run:

```sh
pnpm --filter @sandbox/app-nested build
```

The app should warn and re-extract the design-system files listed in `panda.lib.json`.
`panda lib` infers those fallback files from the source files it parsed.
