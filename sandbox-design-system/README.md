# Design system sandbox

Manual smoke test for React Vite apps consuming Panda design-system packages.

```txt
@sandbox/ds
  -> @sandbox/app
  -> @sandbox/app-postcss

@sandbox/foundations
  -> @sandbox/ds-nested
    -> @sandbox/app-nested
```

## Consumer types: package `/css` vs full local re-emit

Design-system packages export their codegen’d styled-system:

```jsonc
"./css": "./styled-system/css/index.js",
"./tokens": "./styled-system/tokens/index.js",
"./patterns": "./styled-system/patterns/index.js",
"./types": "./styled-system/types/index.d.ts"
```

`@sandbox/app-nested` imports **both** roots to prove they resolve under Vite:

```ts
import { css as dsCss } from '@sandbox/ds-nested/css' // DS-owned styled-system
import { css } from '../styled-system/css' // local full re-emit (+ app overrides)
```

Package `/css` covers DS + parent tokens. Local outdir covers that plus app-only tokens
(e.g. `spacing.2`, app `brand` override in types).

After build, check:

```txt
packages/ds-nested/styled-system/types/tokens.d.ts   # DS + foundations
packages/app-nested/styled-system/types/tokens.d.ts  # + app overrides
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

For the PostCSS consumer:

```sh
pnpm --dir sandbox-design-system dev:postcss
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
- `panda.preset.mjs`

`@sandbox/app` tests the React Vite plugin path. `@sandbox/app-postcss` mirrors it through `@pandacss/postcss`.
`@sandbox/app-nested` tests the React Vite consumer path for a nested design-system chain. The apps override
`colors.brand`, so each should print a `design_system_token_conflict` warning. The app token wins.

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
