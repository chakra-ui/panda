# Panda Studio

Drop a Panda `design-system.json` and see your design system rendered — colors, spacing, type, radii, shadows. No install, no account.

![Colors rendered in Panda Studio](docs/colors-light.png)

## Get your `design-system.json`

Run `panda codegen` in any Panda project and grab `styled-system/specs/design-system.json`. Drop it on the app, paste its contents, or hit **Load sample**.

## Develop

Pins the **published** `@pandacss/*` betas, not the workspace sources — `@pandacss/compiler-wasm` needs a Rust toolchain that deploy builders don't have.

```bash
pnpm install
pnpm --filter studio dev       # Nuxt dev server
pnpm --filter studio build     # prisma generate + panda codegen + nuxt build
pnpm --filter studio generate  # static site, viewer only (no sharing)
```

## Deploy

Vercel project **panda-studio-v2**, root directory `apps/studio`, build command `cd ../../ && pnpm --filter studio build`. Pushing to `v2` deploys automatically.

```bash
pnpm --filter studio run link            # once — writes apps/studio/.vercel
pnpm --filter studio run deploy          # production
pnpm --filter studio run deploy:preview  # preview URL
```

Note the `run`: `pnpm deploy` is a pnpm builtin and won't reach the script. Deploys upload from the repo root (the build needs the workspace) and pass `--project`, since the repo-root `.vercel` points at the docs project.

Environment variables:

- `DATABASE_URL` — Postgres. Shared with the playground, so it **must** carry a distinct `?schema=`; `prisma db push` diffs the whole schema and would otherwise drop the playground's tables.
- `NUXT_PUBLIC_SITE_URL` — public origin for canonical and OG URLs.

## What it does

- **Renders every category** with a view that fits it: colors → swatch grid, spacing/sizes/radii → sorted scale, fonts → specimens, fontSizes/lineHeights/letterSpacings/fontWeights → type ramp, shadows/borders → sample boxes, durations/easings/animations → live chips, the rest → a name/value table.
- **Search** filters the active category; **click a token** to copy its name.
- **Light + dark** plus theme switching, so semantic tokens paint their real colors.
- **Share** a system at `/s/<slug>` (analysis at `/a/<slug>`). No account.
- **Persists** the last-loaded system in IndexedDB.

<p>
  <img src="docs/spacing.png" width="49%" alt="Spacing scale" />
  <img src="docs/colors-dark.png" width="49%" alt="Colors in dark mode" />
</p>

## Analyze usage

The rail's **Analyze usage** link reports which tokens are used, unused, or hot. Drop your source files; the drop decides the tier:

- **Compiler-grade** — include `panda.config.ts` and the real compiler runs in-browser via `@pandacss/compiler-wasm`. Exact, including bare-numeric tokens.
- **Heuristic** — no config, so a name-match scan runs. Accurate for named tokens, approximate for numeric ones.

Nothing leaves the browser unless you press **Share**.

## Stack

Nuxt 3 + Vue 3, [Panda CSS](https://panda-css.com), [Ark UI](https://ark-ui.com).
