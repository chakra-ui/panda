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
pnpm --dir sandbox-design-system overlay:build   # or overlay:dev to open it
```

Then read `packages/overlay/styled-system/recipes/index.js`:

```js
export { chip } from '@sandbox/ds/recipes' // owned by the DS — re-exported, not re-emitted
export * from './panel' // the app's own recipe — emitted locally
export * from './tag' // the app redefined the DS's `tag` — app wins (prints design_system_artifact_conflict)
```

Only `panel.js` and `tag.js` are real modules under `recipes/`; `chip` is not re-emitted. The generic runtime
(`css/`, `helpers.js`, the jsx factory) is still emitted locally because the app's own recipe modules import it by
relative path. The Vite build is the real check that the `@sandbox/ds/*` re-exports resolve.

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
