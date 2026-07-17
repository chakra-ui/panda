# Design system sandbox

Manual smoke test for React Vite apps consuming Panda design-system packages.

```txt
@sandbox/ds
  -> @sandbox/app          simple consume (no app recipes)
  -> @sandbox/overlay      overlay codegen (app extends the design system)
  -> @sandbox/app-postcss

@sandbox/foundations
  -> @sandbox/ds-nested
    -> @sandbox/app-nested
```

`@sandbox/app` and `@sandbox/overlay` are kept separate on purpose: `app` is the plain consume path, `overlay` is the
extension path. If one breaks and the other doesn't, you know which half to look at.

## Overlay demo

`@sandbox/overlay` exercises overlay codegen against `@sandbox/ds` (which ships `tag` and `chip` recipes). Run it:

```sh
pnpm -w build:fast
pnpm --dir sandbox-design-system ds:lib
pnpm --dir sandbox-design-system overlay:build    # or overlay:dev to open it
pnpm --dir sandbox-design-system overlay:verify   # asserts the output is virtualized
```

`overlay:verify` (run automatically inside `build`/`test`) fails if the overlay re-emitted DS
recipes/patterns locally instead of re-exporting them. A Vite build passes either way, so this
assertion is the only thing that catches a stale `compiler.node` silently falling back to a full
tree — rebuild native with `pnpm --filter @pandacss/compiler build:native` if it fails.

Then read `packages/overlay/styled-system/recipes/index.js`:

```js
export { chip } from '@sandbox/ds/recipes' // owned by the DS — re-exported, not re-emitted
export * from './panel' // the app's own recipe — emitted locally
export * from './tag' // the app redefined the DS's `tag` — app wins (prints design_system_artifact_conflict)
```

Only `panel.js` and `tag.js` are real modules under `recipes/`; `chip` is not re-emitted. The generic runtime
(`css/`, `helpers.js`, the jsx factory) is still emitted locally because the app's own recipe modules import it by
relative path. The Vite build is the real check that the `@sandbox/ds/*` re-exports resolve.

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
