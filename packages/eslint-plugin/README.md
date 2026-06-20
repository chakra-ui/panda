# @pandacss/eslint-plugin

ESLint rules for Panda CSS that read your actual config. They know your tokens, recipes, patterns, and utilities — so
they catch a typo'd token, a deprecated recipe, or a hardcoded color that should be a token. 🐼

There's no JSON to generate first. The plugin loads your `panda.config.ts` once and lints against it.

> Beta. ESLint v9 flat config only. Rules are report-only for now — no autofixers yet.

## Install

```sh
pnpm add -D @pandacss/eslint-plugin
```

You need ESLint 9 or later.

## Setup

Add the recommended config to `eslint.config.mjs`. Loading your Panda config is async, so `await` it (top-level `await`
works in flat config):

```js
import panda from '@pandacss/eslint-plugin'

export default [await panda.configs.recommended({ configPath: './panda.config.ts' })]
```

That's it. The rules now run against your project's tokens, recipes, and utilities.

## Rules

Six rules are on in `recommended`:

- `no-invalid-token-paths` (error) — a token reference that doesn't exist, e.g. `token('colors.ghost')`.
- `file-not-included` (error) — a file uses Panda but sits outside your config `include`, so its styles never get
  generated.
- `no-deprecated` (warn) — use of a deprecated token, utility, recipe, or pattern. If you set
  `deprecated: 'use X instead'` in config, that message shows up in the lint error.
- `no-hardcoded-color` (warn) — a raw color (`#fff`, `rgb(...)`) on a color property where a token belongs.
- `no-debug` (warn) — a leftover `debug: true`.
- `extraction-diagnostics` (warn) — parse or extraction problems Panda hit in the file.

Four more are off by default. Turn them on per project:

- `no-important` — `!important` in styles.
- `no-margin-properties` — margin props; nudges you toward `gap` and layout patterns.
- `no-physical-properties` — physical props that have logical equivalents (`left` → `insetInlineStart`).
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
