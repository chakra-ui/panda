# @pandacss/eslint-plugin

ESLint rules for Panda CSS that read your actual config. They know your tokens, recipes, patterns, and utilities — so
they catch a typo'd token, a deprecated recipe, or a hardcoded color that should be a token. 🐼

There's no JSON to generate first. The plugin loads your `panda.config.ts` once and lints against it.

> Beta. ESLint v9 flat config only. Most rules are report-only; a few add fixes/suggestions (noted below).

## Install

```sh
pnpm add -D @pandacss/eslint-plugin
```

You need ESLint 9 or later.

## Setup

Add the recommended config to `eslint.config.mjs`. Loading your Panda config is async, and ESLint
[supports a flat config that resolves to a Promise](https://eslint.org/docs/latest/use/configure/configuration-files),
so `await` it (top-level `await` works in flat config):

```js
import panda from '@pandacss/eslint-plugin'

export default [await panda.configs.recommended({ configPath: './panda.config.ts' })]
```

That's it. The rules now run against your project's tokens, recipes, and utilities.

Top-level `await` works in `eslint.config.mjs` (or `.js` with `"type": "module"`) and in `eslint.config.ts` (jiti ≥2 /
Node ≥22.13 / Deno / Bun). In a CommonJS `eslint.config.cjs`, export a Promise instead — ESLint resolves it:

```js
module.exports = (async () => {
  const panda = (await import('@pandacss/eslint-plugin')).default
  return [await panda.configs.recommended({ configPath: './panda.config.ts' })]
})()
```

The recommended config scopes itself to JS/TS/JSX files and **does not set a parser** — use your project's existing
parser. Most TS setups already have one via [`typescript-eslint`](https://typescript-eslint.io/), and framework projects
via their ESLint preset (`eslint-plugin-vue`, `astro-eslint-parser`, etc.). Panda's rules read source text directly, so
any parser that produces a `Program` works.

To lint framework files (`.vue`, `.svelte`, `.astro`), opt them in via `files` once their parser is configured:

```js
await panda.configs.recommended({ configPath: './panda.config.ts', files: ['**/*.{ts,tsx,vue}'] })
```

### Enabling opt-in rules / changing severities

`recommended` binds every rule under the `@pandacss` plugin, so add opt-in rules (or tweak severities) in your own
`rules` block after it:

```js
export default [
  await panda.configs.recommended({ configPath: './panda.config.ts' }),
  { rules: { '@pandacss/consistent-property-style': ['error', { style: 'shorthand' }] } },
]
```

### Monorepos

Call `recommended` once per Panda config and scope each to its package via `files`:

```js
export default [
  {
    ...(await panda.configs.recommended({ configPath: './packages/web/panda.config.ts' })),
    files: ['packages/web/**'],
  },
  {
    ...(await panda.configs.recommended({ configPath: './packages/app/panda.config.ts' })),
    files: ['packages/app/**'],
  },
]
```

> The Panda config is loaded once and cached; a long-running editor session won't pick up `panda.config` edits until
> ESLint restarts.

## Rules

These rules are on in `recommended`:

- `no-invalid-token-paths` (error) — a token reference that doesn't exist, e.g. `token('colors.ghost')`.
- `no-invalid-nesting` (error) — a nested selector missing `&` (`':hover'` instead of `'&:hover'`), which Panda silently
  ignores. Suggests prefixing `&`.
- `file-not-included` (error) — a file uses Panda but sits outside your config `include`, so its styles never get
  generated.
- `no-deprecated` (warn) — use of a deprecated token, utility, recipe, or pattern. If you set
  `deprecated: 'use X instead'` in config, that message shows up in the lint error.
- `prefer-token` (warn) — a raw value where a token exists, with the token to use. In `recommended` it's scoped to
  colors (the old `no-hardcoded-color`); widen it with `categories` (see below).
- `no-debug` (warn) — a leftover `debug: true`.
- `extraction-diagnostics` (warn) — parse or extraction problems Panda hit in the file.

The rest are off by default. Turn them on per project:

- `no-important` — `!important` in styles.
- `no-margin-properties` — margin props; nudges you toward `gap` and layout patterns.
- `no-physical-properties` — physical props that have logical equivalents (`left` → `insetInlineStart`).
- `no-shorthand-longhand-mix` — a shorthand and one of its longhands in the same block (`margin` + `marginLeft`); the
  longhand wins regardless of source order. Takes `ignore` (groups to allow).
- `consistent-property-style` — enforce one property style: Panda shorthand aliases (`ml`) or longhand canonical names
  (`marginLeft`). Autofixable. Takes `style: 'shorthand' | 'longhand'` (default `longhand`) and `ignore`.
- `prefer-text-style` — a style object setting two or more typography properties that should be one `textStyle` token.

Enable an opt-in rule like any other:

```js
import panda from '@pandacss/eslint-plugin'

export default [
  await panda.configs.recommended({ configPath: './panda.config.ts' }),
  { rules: { '@pandacss/no-important': 'error' } },
]
```

## Options

`no-deprecated` takes a `kinds` option to narrow what it checks:

```js
{ rules: { '@pandacss/no-deprecated': ['warn', { kinds: ['tokens', 'recipes'] }] } }
```

Valid kinds: `tokens`, `utilities`, `recipes`, `patterns`. All are checked by default.

`prefer-token` takes `categories` (which token categories to enforce; defaults to all) and `allow` (raw values to
permit):

```js
{ rules: { '@pandacss/prefer-token': ['warn', { categories: ['colors', 'spacing'], allow: ['transparent'] }] } }
```

It lists the tokens that carry the value and offers each as an editor quick-fix, so you pick — semantic and primitive
both shown (semantic first), themed tokens marked `(themed)`. It matches equivalent forms (`#FFF` == `#ffffff`, `16px`
== `1rem`):

```
Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.
  💡 Use the token "fg.error"
  💡 Use the token "red.500"
```

Quick-fixes apply to each offending leaf — flat literals (`color: '#f00'`), values nested in conditions
(`color: { base: '#f00' }`), and responsive-array elements (`color: ['#f00', ...]`). Coverage spans `css()`, style
props, and recipe styles in `cva()` / `sva()` / `styled('div', { ... })` (`base`, `variants`, `compoundVariants`).

### Migrating from `no-hardcoded-color`

`no-hardcoded-color` is now `prefer-token` scoped to colors. Replace it with:

```js
{ rules: { '@pandacss/prefer-token': ['warn', { categories: ['colors'] }] } }
```

`recommended` already does this, so if you use `configs.recommended` there's nothing to change.

## Settings

The plugin finds your config in this order:

1. `settings.panda.configPath`
2. `settings['@pandacss/configPath']` (migration alias)
3. the nearest Panda config to the file being linted

```js
export default [panda.configs.recommended(), { settings: { panda: { configPath: './panda.config.ts' } } }]
```

## How it works

The plugin builds one Panda compiler per config and reuses it across files. Rules don't re-parse — they ask the compiler
what each file means to Panda (which calls are `css`, which tag is a recipe, which value resolved to a token) and report
on the ESLint nodes. Config loading happens once, up front, so the rule visitors stay synchronous and fast.
