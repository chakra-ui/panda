---
name: panda-css-migrate
description: >-
  Upgrade a Panda CSS project from v1 to v2, or debug a project that worked on 1.x and breaks on the 2.x beta. Use when
  installing @pandacss/dev@beta, when a build fails after upgrading, when config hooks, createStyleContext, template
  literal styles, panda ship, panda mcp, or --cpu-prof stop working, or when CSS output changes after the upgrade. Do
  not use for writing styles (use panda-css), designing tokens and recipes (use panda-css-theming), or migrating from
  Tailwind, Emotion, or styled-components.
---

# Panda CSS v1 → v2

v2 keeps the authoring API and rewrites the compiler in Rust. Your `panda.config.ts` carries over. What breaks is mostly
config plumbing, a few CLI flags, and packages that no longer exist.

The full guide is [`V2_MIGRATION.md`](https://github.com/chakra-ui/panda/blob/main/V2_MIGRATION.md). This skill is the
ordered path through it. Read the guide for anything below that needs detail.

## Before you start

Check the project can even run v2:

- **ESM only.** No CommonJS build. The project needs `"type": "module"`, `.mjs` files, or an ESM-aware bundler.
  `require('@pandacss/dev')` will not work.
- **Node 22 or newer.** Published packages declare `"engines": { "node": ">=22" }`.

If either fails, fix that first. Nothing else matters until the config loads.

## Upgrade checklist

Work in order. Run `panda build` after each group; failures compound if you batch them.

**1. Move every `@pandacss/*` package to `@beta` together.**

```bash
pnpm add -D @pandacss/dev@beta
pnpm add -D @pandacss/postcss@beta   # or @pandacss/vite@beta, @pandacss/webpack@beta, @pandacss/rollup@beta
```

Never mix a v1 package with a v2 one. All packages share one version.

**2. Drop imports of packages that no longer exist.** Their work moved into `@pandacss/compiler`: `@pandacss/core`,
`@pandacss/extractor`, `@pandacss/generator`, `@pandacss/node`, `@pandacss/parser`, `@pandacss/token-dictionary`,
`@pandacss/is-valid-prop`, `@pandacss/logger`, `@pandacss/reporter`, and `@pandacss/studio`. If the project only uses
`@pandacss/dev` plus a bundler plugin, there's nothing to do.

**3. Add presets explicitly.** v2 does not auto-inject them. A config without them gets a bare system: no `bg` or
`color` utilities, no spacing or font scales, no `_hover`.

```ts
export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
})
```

This is the most common "everything is broken after upgrading" cause.

**4. Move hooks onto plugins.**

```ts
// ❌ v1
hooks: { 'parser:before': handler }

// ✅ v2
plugins: [{ name: 'local', hooks: { 'parser:before': { filter: { id: '**/*.{jsx,tsx}' }, handler } } }]
```

Supported: `config:resolved`, `preset:resolved`, `parser:before`, `codegen:prepare`, `codegen:done`, `cssgen:done`.

Gone: `context:created`, `parser:after`, `config:change`, `tokens:created`, `utility:created`, and
`parser:before.configure(...)`. `cssgen:done` is now observe-only, so it can't rewrite the CSS string.

If you used `cssgen:done` to strip unused tokens or keyframes, use `optimize` instead:

```ts
optimize: {
  removeUnusedTokens: true,
  removeUnusedKeyframes: true,
  smartCompoundVariants: true,
}
```

**5. Split `createStyleContext`.** It's gone from `<outdir>/jsx`.

- Config recipe (`cva`) → `createRecipeContext` → `{ withContext }`
- Slot recipe (`sva`) → `createSlotRecipeContext` → `{ withRootProvider, withProvider, withContext }`

**6. Convert template literal styles to objects.** The `syntax` option, the `--syntax` init flag, and tagged-template
styling are all removed.

```tsx
// ❌ v1
const Button = styled.button`
  padding: 10px 15px;
`

// ✅ v2
const Button = styled('button', { base: { padding: '10px 15px' } })
```

Run `panda codegen --clean` afterwards so the old runtime is regenerated.

**7. Replace `globalPositionTry`.** Use `theme.positionTry` plus the `positionTry()` factory.

```ts
// ✅ v2
theme: {
  positionTry: {
    bottom: {
      top: 'anchor(bottom)'
    }
  }
}
css({ positionTryFallbacks: positionTry('bottom') })
```

**8. Fix `scrollbarWidth`.** It takes `auto | thin | none` now, not a `sizes` token. `scrollbarWidth: '4'` was always
invalid CSS. A single color token on `scrollbarColor` moves to `scrollbarThumb`.

**9. Update CLI usage.**

- `panda inspect`, `panda validate`, `panda info` → `panda doctor` (add `--json` for scripts)
- `panda ship` → `panda lib`, and consumers set `designSystem` in config
- `panda mcp` / `panda init-mcp` → `npx -y @pandacss/mcp`
- `--cpu-prof` → `--profile` (writes `.panda/trace.json` and `.panda/timings.json`)
- `--silent` / `--quiet` / `--verbose` → `--log-level silent|error|warn|info|debug`
- Shared flags are kebab-case: `--max-warnings`, `--watch-debounce`, `--trace-output`, `--trace-file`

**10. Rewire design systems.** If the project shipped or consumed a library with `panda ship`:

```ts
// consumer config
export default defineConfig({ designSystem: '@acme/design-system' })
```

Never put build info in `include`. Import styles from your local `outdir` after running `panda build`.

**11. Run the build and read the diagnostics.** `panda build`, then `panda doctor`. A `panda debug` dump under
`<outdir>/debug` shows exactly what the new engine extracted if something looks wrong.

## If the CSS changed

v2 aims for v1 parity. These differences are deliberate, so check them before filing a bug:

- **Border and shorthand overrides.** Atomic rules sort by property breadth, not source order. An all-sides shorthand
  now beats a per-side override. Use the longhand when the override must win: `borderInlineEndWidth: '0'`, not
  `borderInlineEnd: '0'`.
- **Compound variants** emit eagerly as named classes in `@layer recipes.compound_variants`. Set
  `optimize.smartCompoundVariants: true` to emit only the combinations you use.
- **No universal variable reset.** v1 seeded `--translate-x`, `--blur` and friends on every element. v2 registers them
  with `@property`. If you target engines without `@property` support, set `optimize.propertyFallback: true`.
- **Breakpoints use range syntax**, `@media (width >= 48rem)`. px and em normalize to rem.
- **Prefixed declarations come first** (`-webkit-mask-image` before `mask-image`).
- **Unused `@property` registrations are dropped.** If the only thing reading a registered variable is CSS that Panda
  never scans, declare it in `globalCss` too.
- **Adjacent rules with identical declarations merge**, and rules sharing a `@media` or `@supports` wrapper are grouped.

Class names changed in a few places (typography shorthands, for instance). Don't assert on generated class names.

## Things that moved, not broke

If the upgrade surfaces one of these, it isn't a regression you introduced:

- The Astro-based Studio is gone. A CLI-generated replacement is planned.
- Some community presets (`preset-atlaskit`, `preset-open-props`) and standalone plugins aren't ported. Use the
  first-party `@pandacss/preset-typography` instead of the community typography preset. Its default size is `md`, not
  `base`.
- If the build misbehaves under `@pandacss/postcss`, try the Vite plugin or plain `panda build` to isolate it before
  filing a bug.

For what's still being finished in the beta, read the "Still being finalized" section of
[`V2_MIGRATION.md`](https://github.com/chakra-ui/panda/blob/main/V2_MIGRATION.md) rather than trusting a status claim
copied into a skill.

## It's working if

- `panda build` completes with no diagnostics on a config you didn't have to rewrite.
- `presets` is set explicitly, and utilities like `bg` and conditions like `_hover` resolve again.
- Nothing imports `@pandacss/core`, `@pandacss/node`, or the other folded packages.
- No `hooks` key sits at the config root, and no call to `createStyleContext` survives.
- The CSS diff against v1 contains only the deliberate differences listed above.

## See also

- The full guide: [`V2_MIGRATION.md`](https://github.com/chakra-ui/panda/blob/main/V2_MIGRATION.md).
- Writing styles once the upgrade is done: call the Skill tool with "panda-css".
- Tokens and recipe architecture: call the Skill tool with "panda-css-theming".
