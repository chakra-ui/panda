---
title: CSS custom functions (`@function`)
status: proposed
scope:
  - packages/types
  - packages/dev
  - packages/config
  - packages/compiler-shared
  - packages/compiler
  - crates/pandacss_config
  - crates/pandacss_codegen
  - crates/pandacss_extractor
  - crates/pandacss_project
  - crates/pandacss_stylesheet
related:
  - codegen-design.md
  - literal-evaluator.md
  - cross-file-resolution.md
  - stylesheet.md
  - css-value-fallbacks.md
  - design-system-manifest.md
  - virtual-styled-system.md
---

# CSS custom functions (`@function`)

## Summary

Panda should support native CSS custom functions as theme definitions plus generated, typed call builders:

```ts
import { transparent } from '../styled-system/functions'

const className = css({
  backgroundColor: transparent('brand', 0.8),
})
```

Because the first parameter is `<color>`, its generated type includes configured color tokens and raw CSS colors. The
helper resolves the token and returns `--transparent(var(--colors-brand), 0.8)`. Panda emits the matching native
`@function` definition. The browser, not Panda, evaluates the function at computed-value time.

The proposed surface is:

- `theme.functions` for serializable definitions,
- `defineCssFunction()` for bootstrap-safe use while authoring config recipes,
- `styled-system/functions` for generated application code,
- native `@function` blocks in the tokens layer,
- no compile-time evaluator or automatic polyfill.

This is a proposed feature. No part of it is implemented yet.

## Platform status

CSS custom functions are defined by the [CSS Custom Functions and Mixins Module](https://drafts.csswg.org/css-mixins/).
A function accepts CSS values and returns one CSS value:

```css
@function --transparent(--color <color>, --alpha <number>: 0.8) returns <color> {
  result: oklch(from var(--color) l c h / var(--alpha));
}

.card {
  background-color: --transparent(var(--colors-brand), 0.5);
}
```

The important platform semantics are:

- calls are evaluated at computed-value time,
- parameters and local variables are represented as locally scoped custom properties,
- a function can read custom properties from the calling element,
- conditional group rules such as `@media` can change the result,
- the last matching `result` wins; there is no early return,
- a call is valid where `var()` is valid,
- parameter and return types are checked by the browser,
- missing definitions, cycles, excess arguments, or invalid results produce the guaranteed-invalid value,
- names are tree-scoped; stronger cascade layers and later definitions win,
- a comma-separated value passed as one argument must be wrapped in `{ ... }`.

These semantics rule out a general build-time evaluator. For example:

```css
@function --double-z() returns <number> {
  result: calc(var(--z) * 2);
}

.card {
  --z: 3;
  z-index: --double-z();
}
```

Panda cannot replace `--double-z()` without knowing the computed custom properties on the calling element. The same
constraint applies to media queries, container queries, `attr()`, inherited custom properties, and calls from inside
another function.

As of August 2026, `@function` is available in Chromium 139+, but not Firefox or Safari. It is experimental and not
Baseline. The initial Panda API must be opt-in and must not imply cross-browser support.

## Goals

1. Emit standards-compliant `@function` rules without changing their runtime semantics.
2. Generate discoverable, typed call builders from `theme.functions`.
3. Allow calls in `css()`, JSX style props, `cva()`, `sva()`, config recipes, and config slot recipes.
4. Preserve static extraction when generated helpers receive static values.
5. Connect CSS parameter syntaxes to compatible token categories for autocomplete and runtime resolution.
6. Ship definitions and helpers through `panda lib`.
7. Preserve source order inside a function body.
8. Keep CSS names and parameter signatures stable across design-system consumers.

## Non-goals

- Evaluating arbitrary CSS functions in Rust or JavaScript.
- Polyfilling call-site custom properties, media queries, container queries, or `attr()`.
- Supporting CSS `@mixin`, `@apply`, macros, or declaration-returning functions.
- Parsing the complete CSS value grammar in TypeScript.
- Inferring a token category from a function's return type. Token inference applies to input parameters only.
- Tree-shaking function definitions in the first implementation.
- Guessing an ambiguous token category from broad syntaxes such as `<length>` or `<number>`.

## Authoring model

### Basic definition

Functions live under `theme.functions`:

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    functions: {
      transparent: {
        parameters: {
          color: { syntax: '<color>' },
          alpha: { syntax: '<number>', token: 'opacity', default: '0.8' },
        },
        returns: '<color>',
        body: {
          result: 'oklch(from var(--color) l c h / var(--alpha))',
        },
      },
    },
  },
})
```

Defining `theme.functions` is the opt-in. Panda should mark the config types and diagnostics as experimental rather than
add a second feature flag that can disagree with the presence of definitions.

The record key is the generated TypeScript export name. The CSS name defaults to the kebab-cased key with a `--` prefix:

```txt
transparent       → --transparent
narrowWide        → --narrow-wide
progressionScale  → --progression-scale
```

Use `cssName` when the physical CSS name is already part of a public contract:

```ts
theme: {
  functions: {
    alpha: {
      cssName: '--acme-transparent',
      // ...
    },
  },
}
```

`cssName` must start with `--`. It is never hashed and does not inherit Panda's `prefix`. A published function name is
referenced by generated helpers, hydrated design-system atoms, and possibly handwritten CSS. Changing it is a breaking
change.

### Ordered parameters

Parameters are an insertion-ordered object. The key is the logical parameter name, which avoids repeating `name` in
every value:

```ts
parameters: {
  color: {
    syntax: '<color>',
  },
  alpha: {
    syntax: 'type(<number> | <percentage>)',
    token: 'opacity',
    default: '0.8',
  },
}
```

The serializable shape is:

```ts
interface CssFunctionParameter {
  syntax?: CssFunctionSyntax
  token?: TokenCategory | false
  default?: string
}

type CssFunctionParameters = Record<string, CssFunctionParameter>
```

Object order is the native call signature. Panda adds `--` to parameter names when needed:

```txt
color → --color
--alpha → --alpha
```

### Parameter syntax and token categories

A parameter has two related types:

- `syntax` describes what the browser accepts after custom properties resolve,
- `token` describes which Panda token keys the generated helper accepts and resolves to CSS variables.

Panda infers a token category only when a CSS syntax has one strong design-token meaning:

| CSS syntax | Inferred token category |
| ---------- | ----------------------- |
| `<color>`  | `colors`                |
| `<time>`   | `durations`             |

These are the only strong automatic mappings in the current `@function` grammar. CSS function syntax types are limited
to angle, color, custom-ident, image, integer, length, length-percentage, number, percentage, resolution, string, time,
url, transform-function, and `type(...)`. Names such as `<font-family>`, `<font-weight>`, `<easing-function>`, and
`<shadow>` are not valid native parameter syntax types.

For example, `<color>` includes both configured color tokens and raw CSS colors:

```ts
color: {
  syntax: '<color>'
}
// generated argument type:
// TokenValue<'colors'> | CssColor
```

Broad syntaxes are ambiguous. A `<length>` could mean spacing, size, radius, font size, border width, blur, or letter
spacing. A `<number>` could mean opacity, line height, or z-index. Authors connect those explicitly:

```ts
parameters: {
  gap: { syntax: '<length>', token: 'spacing' },
  radius: { syntax: '<length>', token: 'radii' },
  alpha: { syntax: '<number>', token: 'opacity' },
  easing: { syntax: 'type(*)', token: 'easings' },
  font: { syntax: 'type(*)', token: 'fonts' },
  scale: { syntax: '<number>', token: false },
}
```

`token: false` disables an otherwise inferred category. An explicit category must exist in `TokenCategory`, but it does
not need to have values in every consuming config.

Syntax unions infer a category only when all alternatives map to the same category. Lists preserve that category:

```ts
stops: {
  syntax: '<color>#'
}
// colors

value: {
  syntax: 'type(<color> | <image>)'
}
// no inference: color and image do not share one category
```

This metadata drives types and runtime resolution. It does not change the emitted native parameter syntax.

The first version requires parameters with defaults to form a trailing suffix. CSS itself permits other arrangements,
but trailing defaults map to TypeScript optional parameters without introducing empty positional arguments:

```ts
// Valid
parameters: {
  color: { syntax: '<color>' },
  alpha: { syntax: '<number>', default: '0.8' },
}

// Rejected initially: a required parameter follows a defaulted parameter
parameters: {
  alpha: { syntax: '<number>', default: '0.8' },
  color: { syntax: '<color>' },
}
```

`parameters` is an atomic field during config and preset merging. Panda replaces the whole object instead of
deep-merging individual parameters. Reordering keys changes the native and generated call signature and is a breaking
change. Integer-like and otherwise invalid parameter keys are rejected so JavaScript property-order rules cannot
silently reorder the signature.

### Ordered body

The body is also an insertion-ordered object. `result` is a descriptor, `--*` keys are local custom properties, and `@*`
keys contain nested bodies:

```ts
body: {
  result: 'var(--wide)',
  '@media (width < 700px)': {
    result: 'var(--narrow)',
  },
}
```

The serializable shape is:

```ts
interface CssFunctionBody {
  result?: string | string[]
  [variable: `--${string}`]: string | string[] | undefined
  [atRule: `@${string}`]: CssFunctionBody | undefined
}
```

Local variables use their CSS custom-property names directly:

```ts
body: {
  '--duration': '1s',
  '--easing': 'linear',
  result: 'var(--animation) var(--duration) var(--count) var(--easing)',
}
```

This emits:

```css
@function --anim-1s(--animation, --count) {
  --duration: 1s;
  --easing: linear;
  result: var(--animation) var(--duration) var(--count) var(--easing);
}
```

Repeated descriptors use arrays as ordered declaration fallbacks:

```ts
body: {
  result: [
    'rgb(255 0 0)',
    'oklch(62% 0.2 25)',
  ],
}
```

This emits two `result` descriptors in order, allowing the browser to retain the first when it cannot parse the second.
The same array form works for local custom-property fallbacks. At-rules remain object keys; duplicate identical at-rules
should be merged into one nested body.

Object order remains semantically important. For example, placing an unconditional `result` after a matching conditional
result overrides it. The TypeScript host, config snapshot, Rust config, and stylesheet emitter must preserve insertion
order end to end. Rust must use `IndexMap` or `serde_json::Map` with `preserve_order`, never `BTreeMap`, for parameters
and bodies.

`body` is also atomic during config and preset merging. Deep-merging nested body keys could move declarations or combine
an implementation with the function it overrides.

### Supported syntax strings

`syntax` and `returns` accept the CSS function syntax grammar:

```ts
{
  syntax: '<color>'
}
{
  syntax: '<length>+'
}
{
  syntax: '<length>#'
}
{
  syntax: 'type(<number> | <percentage>)'
}
{
  syntax: 'type(*)'
}
```

The type should remain open:

```ts
type CssFunctionSyntax = LiteralUnion<
  | '*'
  | '<angle>'
  | '<color>'
  | '<custom-ident>'
  | '<image>'
  | '<integer>'
  | '<length>'
  | '<length-percentage>'
  | '<number>'
  | '<percentage>'
  | '<resolution>'
  | '<string>'
  | '<time>'
  | '<transform-function>'
  | '<url>'
>
```

Panda performs structural validation. It does not claim full CSS grammar validation without a CSS value parser.

## Bootstrap-safe config authoring

Config recipes are evaluated while Panda loads `panda.config.ts`. They cannot import `styled-system/functions` on the
first codegen run because that file does not exist yet.

`defineCssFunction()` solves that cycle. It returns:

- a typed call builder for use while constructing config,
- a JSON-safe `.definition` value for registration.

```ts filename="functions.ts"
import { defineCssFunction } from '@pandacss/dev'

export const transparent = defineCssFunction('transparent', {
  parameters: {
    color: { syntax: '<color>' },
    alpha: { syntax: '<number>', token: 'opacity', default: '0.8' },
  },
  returns: '<color>',
  body: {
    result: 'oklch(from var(--color) l c h / var(--alpha))',
  },
})
```

The callable and its serializable definition have separate roles:

```ts
transparent('{colors.brand}', 0.5)
// → "--transparent({colors.brand}, 0.5)"

transparent.definition
// → { parameters, returns, body }
```

Register the definition:

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { transparent } from './functions'

export default defineConfig({
  theme: {
    functions: {
      transparent: transparent.definition,
    },
  },
})
```

No callback crosses the native or WASM boundary. `transparent.definition` is plain serializable data. The authoring call
builder only creates a string while the config module executes. Its `name` argument determines the physical CSS name and
`.definition` includes that normalized `cssName`; registration validates that the logical key and physical name do not
conflict with another function.

Direct object definitions remain valid when a config does not need to call the function during config construction.

## Generated `styled-system/functions`

Panda generates one module:

```txt
styled-system/
  functions/
    index.js
    index.d.ts
```

For:

```ts
theme: {
  functions: {
    transparent: {
      parameters: {
        color: { syntax: '<color>' },
        alpha: { syntax: '<number>', token: 'opacity', default: '0.8' },
      },
      returns: '<color>',
      body: { result: '...' },
    },
  },
}
```

the declaration output is approximately:

```ts
import type { CssColor, CssNumeric } from '../types/system-types'
import type { TokenValue } from '../types/tokens'

declare const cssFunctionReturn: unique symbol

export type CssFunctionCall<TSyntax extends string = '*'> = string & {
  readonly [cssFunctionReturn]: TSyntax
}

export declare function transparent(
  color: TokenValue<'colors'> | CssColor,
  alpha?: TokenValue<'opacity'> | CssNumeric,
): CssFunctionCall<'<color>'>
```

The runtime output contains only the token-category lookups used by function parameters. Configured token keys map to
their final prefix/hash-aware CSS variables:

```ts
const colorTokens: Record<string, string> = {
  brand: 'var(--colors-brand)',
  surface: 'var(--colors-surface)',
}

const opacityTokens: Record<string, string> = {
  muted: 'var(--opacity-muted)',
}

export function transparent(color, alpha) {
  return alpha === undefined
    ? `--transparent(${colorTokens[color] ?? color})`
    : `--transparent(${colorTokens[color] ?? color}, ${opacityTokens[alpha] ?? alpha})`
}
```

The maps are shared by every generated helper using that category and omitted when no parameter needs them. Keeping the
lookup inline preserves the existing pure-function evaluator contract: captured object literals, computed member access,
nullish coalescing, conditionals, and templates already fold. A nested call to `token.var()` would not fold because pure
callables currently reject nested calls.

Generated helpers:

- construct native CSS calls,
- do not evaluate function bodies,
- do not validate arbitrary CSS strings,
- resolve known token keys before constructing the call,
- omit trailing arguments that use CSS defaults,
- preserve explicit arguments verbatim.

The initial syntax-to-TypeScript mapping combines native CSS values with an inferred or explicit token category:

| CSS syntax                               | Native value type  | Default token addition    |
| ---------------------------------------- | ------------------ | ------------------------- |
| `<color>`                                | `CssColor`         | `TokenValue<'colors'>`    |
| `<length>`, `<length-percentage>`        | `CssLength`        | none; author chooses      |
| `<number>`, `<integer>`, `<percentage>`  | `CssNumeric`       | none; author chooses      |
| `<time>`                                 | `string \| number` | `TokenValue<'durations'>` |
| `<angle>`, `<resolution>`                | `string \| number` | none                      |
| `<image>`, `<url>`, `<string>`           | `string`           | none                      |
| `<custom-ident>`, `<transform-function>` | `string`           | none                      |
| custom, mixed, or universal syntax       | `string \| number` | explicit `token` only     |

This gives name, arity, default, and rough value safety. It does not prove that a function returning `<color>` is used
only in a color-valued property. That requires property grammar metadata which Panda does not generate today.

Known token keys use token-first resolution, matching Panda utility values:

```ts
transparent('brand', 'muted')
// → --transparent(var(--colors-brand), var(--opacity-muted))

transparent('oklch(62% 0.2 250)', 0.72)
// → --transparent(oklch(62% 0.2 250), 0.72)
```

If a configured token key is also a valid CSS keyword, the token wins. Use a non-colliding explicit CSS spelling, such
as `rgb(255 0 0)` instead of `red`, when the raw value is intended.

### Passing comma-containing values

CSS requires braces around one argument containing top-level commas:

```css
width: --max-plus-x({1px, 7px, 2px}, 3px);
```

The initial helper preserves arguments rather than embedding a second CSS parser:

```ts
maxPlusX('{1px, 7px, 2px}', '3px')
```

Panda can add a small `cssList()` argument helper later if this is common:

```ts
maxPlusX(cssList('1px', '7px', '2px'), '3px')
```

Automatic comma detection is deferred because commas nested in `rgb()`, gradients, and other CSS functions must not be
wrapped.

## Usage in application code

### Using a function in `css()`

```tsx
import { css } from '../styled-system/css'
import { transparent } from '../styled-system/functions'
import { token } from '../styled-system/tokens'

export function Card() {
  return (
    <div
      className={css({
        backgroundColor: transparent('surface', 0.8),
        borderColor: transparent(token.var('colors.border'), 0.5),
      })}
    />
  )
}
```

Extracted values:

```css
background-color: --transparent(var(--colors-surface), 0.8);
border-color: --transparent(var(--colors-border), 50%);
```

### Using defaults

```ts
css({
  backgroundColor: transparent('surface'),
})
```

The helper omits the optional argument:

```css
background-color: --transparent(var(--colors-surface));
```

The browser applies the `0.8` default from the definition.

### Using responsive Panda values

Panda conditions and function conditions solve different problems and compose normally:

```ts
css({
  backgroundColor: {
    base: transparent(token.var('colors.surface'), 0.72),
    md: transparent(token.var('colors.surface'), 0.9),
  },
})
```

Panda emits the breakpoint wrapper. The browser evaluates each native function call inside its declaration.

### Using JSX style props

Generated calls are normal static style values in JSX:

```tsx
import { Box } from '../styled-system/jsx'
import { transparent } from '../styled-system/functions'
import { token } from '../styled-system/tokens'

export function Banner() {
  return (
    <Box bg={transparent(token.var('colors.brand'), 0.12)} borderColor={transparent('brand', 0.45)} borderWidth="1px" />
  )
}
```

The extractor folds the imported pure helper before it lowers the JSX style props.

### Using a function that contains responsive logic

```ts filename="panda.config.ts"
theme: {
  functions: {
    narrowWide: {
      parameters: {
        narrow: {},
        wide: {},
      },
      body: {
        result: 'var(--wide)',
        '@media (width < 700px)': {
          result: 'var(--narrow)',
        },
      },
    },
  },
}
```

```ts
css({
  padding: narrowWide('3', '6'),
  gridTemplateColumns: `repeat(${narrowWide(1, 3)}, 1fr)`,
})
```

This is not equivalent to Panda breakpoint extraction. The same call can appear in arbitrary CSS values and reacts in
the browser.

### Composing functions

```ts filename="panda.config.ts"
theme: {
  functions: {
    lighter: {
      parameters: {
        color: { syntax: '<color>' },
        amount: { syntax: '<number>', default: '0.2' },
      },
      returns: '<color>',
      body: {
        result: 'oklch(from var(--color) calc(l + var(--amount)) c h)',
      },
    },
    borderColor: {
      parameters: {
        color: { syntax: '<color>' },
      },
      returns: '<color>',
      body: {
        result: '--lighter(var(--color), 0.1)',
      },
    },
  },
}
```

```ts
css({
  borderColor: borderColor(token.var('colors.brand')),
})
```

Panda preserves the nested native call. The browser resolves function dependencies. Definition order does not require
topological sorting, but Panda should diagnose direct dependency cycles between configured functions.

### Using call-site custom properties

```ts filename="panda.config.ts"
theme: {
  functions: {
    scaleLocal: {
      parameters: {
        factor: { syntax: '<number>' },
      },
      returns: '<length>',
      body: {
        result: 'calc(var(--local-size) * var(--factor))',
      },
    },
  },
}
```

```ts
css({
  '--local-size': '8px',
  padding: scaleLocal(2),
})
```

This is the clearest example of why Panda does not inline function bodies. `--local-size` belongs to the element that
calls the function.

## Usage in atomic recipes

### `cva()`

Generated helpers can be used in `cva()` base styles, variants, and compound variants:

```ts filename="button.recipe.ts"
import { cva } from '../styled-system/css'
import { transparent } from '../styled-system/functions'
import { token } from '../styled-system/tokens'

export const button = cva({
  base: {
    color: token.var('colors.white'),
    backgroundColor: transparent(token.var('colors.brand'), 0.9),
    borderColor: transparent(token.var('colors.brand'), 0.55),
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: transparent(token.var('colors.brand'), 1),
      },
      subtle: {
        backgroundColor: transparent(token.var('colors.brand'), 0.14),
        color: token.var('colors.brand'),
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: transparent(token.var('colors.brand'), 0.7),
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
        opacity: 0.6,
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      visual: 'subtle',
      disabled: true,
      css: {
        backgroundColor: transparent(token.var('colors.brand'), 0.08),
      },
    },
  ],
})
```

Each helper call is static. The existing pure-function evaluator folds it to a string before atomic encoding.

### `sva()`

Function calls work in every slot:

```ts filename="card.recipe.ts"
import { sva } from '../styled-system/css'
import { transparent } from '../styled-system/functions'
import { token } from '../styled-system/tokens'

export const card = sva({
  slots: ['root', 'title', 'body'],
  base: {
    root: {
      backgroundColor: transparent(token.var('colors.surface'), 0.96),
      borderColor: transparent(token.var('colors.border'), 0.65),
      borderWidth: '1px',
    },
    title: {
      color: transparent(token.var('colors.text'), 0.96),
    },
    body: {
      color: transparent(token.var('colors.text'), 0.72),
    },
  },
  variants: {
    elevated: {
      true: {
        root: {
          boxShadow: `0 12px 32px ${transparent(token.var('colors.shadow'), 0.18)}`,
        },
      },
    },
  },
})
```

The function result can be a whole property value or one component of a larger value.

## Usage in config recipes

Config recipes run before generated files exist. They use the callable returned by `defineCssFunction()`.

### `defineRecipe()`

```ts filename="functions.ts"
import { defineCssFunction } from '@pandacss/dev'

export const transparent = defineCssFunction('transparent', {
  parameters: {
    color: { syntax: '<color>' },
    alpha: { syntax: '<number>', token: 'opacity', default: '0.8' },
  },
  returns: '<color>',
  body: {
    result: 'oklch(from var(--color) l c h / var(--alpha))',
  },
})
```

```ts filename="button.recipe.ts"
import { defineRecipe } from '@pandacss/dev'
import { transparent } from './functions'

export const buttonRecipe = defineRecipe({
  className: 'button',
  base: {
    backgroundColor: transparent('{colors.brand}', 0.9),
    borderColor: transparent('{colors.brand}', 0.6),
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: transparent('{colors.brand}', 1),
        color: '{colors.white}',
      },
      subtle: {
        backgroundColor: transparent('{colors.brand}', 0.14),
        color: '{colors.brand}',
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
        opacity: 0.6,
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      visual: 'subtle',
      disabled: true,
      css: {
        backgroundColor: transparent('{colors.brand}', 0.08),
      },
    },
  ],
})
```

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { buttonRecipe } from './button.recipe'
import { transparent } from './functions'

export default defineConfig({
  theme: {
    functions: {
      transparent: transparent.definition,
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
```

Token references inside arguments use normal config token syntax. Panda resolves `{colors.brand}` to its CSS variable
while lowering the recipe value.

### `defineSlotRecipe()`

```ts filename="card.recipe.ts"
import { defineSlotRecipe } from '@pandacss/dev'
import { transparent } from './functions'

export const cardRecipe = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'title', 'body'],
  base: {
    root: {
      backgroundColor: transparent('{colors.surface}', 0.96),
      borderColor: transparent('{colors.border}', 0.65),
      borderWidth: '1px',
    },
    title: {
      color: transparent('{colors.text}', 0.96),
    },
    body: {
      color: transparent('{colors.text}', 0.72),
    },
  },
  variants: {
    tone: {
      neutral: {
        root: {
          backgroundColor: transparent('{colors.gray.50}', 0.96),
        },
        title: {
          color: transparent('{colors.gray.950}', 0.96),
        },
        body: {
          color: transparent('{colors.gray.950}', 0.72),
        },
      },
      brand: {
        root: {
          backgroundColor: transparent('{colors.brand}', 0.12),
          borderColor: transparent('{colors.brand}', 0.45),
        },
        title: {
          color: transparent('{colors.brand}', 1),
        },
      },
    },
    elevated: {
      true: {
        root: {
          translate: '0 -1px',
        },
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      tone: 'brand',
      elevated: true,
      css: {
        root: {
          boxShadow: `0 16px 40px ${transparent('{colors.brand}', 0.2)}`,
        },
      },
    },
  ],
})
```

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { cardRecipe } from './card.recipe'
import { transparent } from './functions'

export default defineConfig({
  theme: {
    functions: {
      transparent: transparent.definition,
    },
    slotRecipes: {
      card: cardRecipe,
    },
  },
})
```

### Why config recipes do not import generated helpers

This is invalid on a clean checkout:

```ts
// Do not do this in a file imported by panda.config.ts.
import { transparent } from './styled-system/functions'
```

The config must load before codegen can discover `theme.functions`, but the generated file does not exist until codegen
finishes. Source-side `cva()` and `sva()` run after codegen and should use `styled-system/functions`. Config recipes use
the authoring helper from their local definition module.

## Static extraction and transform

`styled-system/functions` is not a Panda style factory. It does not need a new `MatchCategory` or `importMap` category.

The generated helper is a pure imported function:

```ts
export function transparent(color, alpha) {
  return alpha === undefined ? `--transparent(${color})` : `--transparent(${color}, ${alpha})`
}
```

The existing cross-file resolver and pure-function evaluator can fold it inside a style call:

```ts
css({
  backgroundColor: transparent('red', 0.5),
})
```

```txt
css({...})
  → resolve imported transparent()
  → fold static arguments
  → "--transparent(red, 0.5)"
  → normal style value
  → normal atom encoding
```

No new atom or build-info value is required. The final string is stored exactly like any other CSS value.

The helper implementation must stay inside the pure evaluator's supported subset. Avoid rest arguments, `Array.map`,
`Array.join`, proxies, or runtime registries in generated output.

### Dynamic arguments

This call is not statically extractable:

```tsx
function Card({ color }: { color: string }) {
  return <div className={css({ backgroundColor: transparent(color, 0.8) })} />
}
```

Keeping the generated helper at runtime does not make the surrounding `css()` call statically know every possible CSS
value. Existing unextractable-call behavior applies.

Use a CSS variable when the value changes at runtime:

```tsx
function Card({ color }: { color: string }) {
  return (
    <div
      style={{ '--card-color': color } as React.CSSProperties}
      className={css({
        backgroundColor: transparent('var(--card-color)', 0.8),
      })}
    />
  )
}
```

The extracted declaration remains static while the browser reads the per-element custom property.

### Calls outside Panda style factories

The helper can be used in a raw inline style:

```tsx
<div style={{ backgroundColor: transparent('var(--card-color)', 0.8) }} />
```

Panda does not need to extract that call. The generated helper returns a string at runtime. The project still has to
generate CSS once so the configured `@function` definition exists.

## Token references

Functions interact with tokens in three places.

### Call arguments in source

An inferred or explicit parameter category adds that category's configured token keys to the generated argument type:

```ts
transparent('brand', 'muted')
// → --transparent(var(--colors-brand), var(--opacity-muted))
```

Editors autocomplete `ColorToken` for the first argument and `OpacityToken` for the second. At runtime and during
extraction, the generated category maps resolve known keys. Raw CSS values pass through unchanged.

`token.var()` remains useful when the function definition deliberately has no category metadata or when the caller wants
to be explicit:

```ts
transparent(token.var('colors.brand'), 0.8)
```

The generated helper sees an already-resolved CSS variable and leaves it unchanged.

This connection should reuse the existing `TokenTypeData.categories` and `TokenValue<T>` output. Panda must not build a
second token-type model for functions.

### Call arguments in config recipes

Config modules load before generated token unions and maps exist. The bootstrap-safe authoring helper therefore uses
explicit config token references:

```ts
transparent('{colors.brand}', 0.8)
```

The config style-value path resolves the token reference before CSS emission.

### Function defaults and bodies

Explicit token references are also valid in serializable definitions:

```ts
theme: {
  functions: {
    surface: {
      parameters: {
        fallback: {
          syntax: '<color>',
          default: '{colors.surface}',
        },
      },
      returns: '<color>',
      body: {
        result: 'var(--surface-color, var(--fallback))',
      },
    },
  },
}
```

Token references in parameter defaults, local variables, and `result` values must:

1. resolve through the token dictionary,
2. emit the correct CSS variable for prefix/hash settings,
3. count as token usage when `optimize.removeUnusedTokens` is enabled.

Token values resolved by generated function helpers become `var(--...)` references inside the final atom. Existing
declaration usage collection scans those nested variables, so unused-token pruning can retain them without a new atom or
build-info shape.

## Native CSS emission

Functions emit in `@layer tokens`, alongside other reusable theme primitives such as keyframes:

```css
@layer tokens {
  @function --transparent(--color <color>, --alpha <number>: 0.8) returns <color> {
    result: oklch(from var(--color) l c h / var(--alpha));
  }
}
```

This avoids a sixth public Panda layer. It also keeps function definitions layered, so a deliberate unlayered author
definition can override Panda output.

Emission rules:

- sort function definitions by logical config name for deterministic output,
- preserve parameter order,
- preserve every body entry and fallback array in authored order,
- preserve function references regardless of definition order,
- normalize logical parameter names to dashed identifiers,
- validate local custom-property keys and emit them exactly as authored,
- use the exact `cssName` when supplied,
- emit all configured functions in the first implementation,
- mark referenced tokens before unused-token pruning,
- make `has_base_layer`/tokens-layer presence account for function-only configs,
- include functions in normal, minified, split, and layer-polyfill test matrices.

The cascade-layer polyfill cannot make `@function` work in unsupported browsers. If flattening layers changes function
name precedence, Panda should report a diagnostic rather than claim equivalent output.

## Validation and diagnostics

Structural validation belongs in `pandacss_config` and follows `validation: none | warn | error`.

Proposed codes:

| Code                                      | Default severity | Meaning                                                       |
| ----------------------------------------- | ---------------- | ------------------------------------------------------------- |
| `css_function_name_invalid`               | error            | logical export key or `cssName` cannot be emitted             |
| `css_function_name_conflict`              | error            | two logical keys normalize to the same CSS or TS name         |
| `css_function_parameter_invalid`          | error            | parameter name is invalid                                     |
| `css_function_parameter_duplicate`        | error            | normalized parameter name appears twice                       |
| `css_function_parameter_order_invalid`    | error            | required parameter follows one with a default                 |
| `css_function_token_category_invalid`     | error            | parameter names an unsupported `TokenCategory`                |
| `css_function_token_syntax_mismatch`      | warning          | token category is clearly incompatible with native syntax     |
| `css_function_result_missing`             | warning          | no reachable base result; calls always produce invalid values |
| `css_function_body_rule_unsupported`      | error            | body contains a rule Panda does not model                     |
| `css_function_dependency_cycle`           | warning          | configured functions directly or transitively call each other |
| `css_function_signature_conflict`         | error            | app changes a design-system function's public signature       |
| `css_function_browser_support_limited`    | info             | experimental output targets browsers without broad support    |
| `css_function_layer_polyfill_unsupported` | warning          | layer flattening cannot preserve native function semantics    |

Panda can validate obvious primitive defaults:

```ts
{ syntax: '<number>', default: 'red' }
```

It must not claim full syntax validation without using a CSS parser that implements the same syntax grammar as the
browser.

Unknown native functions inside a body remain valid. A design system may call a function defined by application CSS.
Cycle diagnostics only inspect calls whose `cssName` belongs to the resolved Panda config.

## Design-system publishing

### Producer

`panda lib` publishes:

```txt
@acme/ds/
  styled-system/
    functions/
      index.js
      index.d.ts
  dist/panda/
    lib.json
    preset.mjs
    buildinfo.json
```

The package exports include:

```json
{
  "exports": {
    "./functions": {
      "types": "./styled-system/functions/index.d.ts",
      "default": "./styled-system/functions/index.js"
    }
  }
}
```

The preset carries `theme.functions`. Build info does not need a new payload shape because extracted declarations
already contain final call strings.

### Consumer

A design-system component can publish:

```ts
import { css } from '@acme/ds/css'
import { transparent } from '@acme/ds/functions'
import { token } from '@acme/ds/tokens'

export const card = css({
  backgroundColor: transparent(token.var('colors.surface'), 0.92),
})
```

The consumer hydrates:

```css
background-color: --acme-transparent(var(--colors-surface), 0.92);
```

and receives the matching definition from the merged design-system preset.

The function CSS name and signature are public contracts:

```ts
// Compatible implementation override: same name and parameters
theme: {
  extend: {
    functions: {
      transparent: {
        cssName: '--acme-transparent',
        parameters: {
          color: { syntax: '<color>' },
          alpha: { syntax: '<number>', token: 'opacity', default: '0.8' },
        },
        returns: '<color>',
        body: { result: 'color-mix(in oklab, var(--color), transparent)' },
      },
    },
  },
}
```

Changing `cssName`, parameter order, parameter type, token category, default presence, or return type is incompatible
with already published helpers and hydrated atoms:

```ts
// Incompatible: hydrated code still calls (--color, --alpha)
parameters: {
  alpha: { syntax: '<number>', token: 'opacity' },
  color: { syntax: '<color>' },
}
```

Panda should report `css_function_signature_conflict` instead of silently accepting the mismatch.

### Overlay codegen

For a single-level design system:

- DS-owned helpers can be re-exported from `@acme/ds/functions`,
- app-added helpers emit locally,
- an app implementation override with a compatible signature emits locally and removes the DS re-export,
- nested design-system chains can use the existing full-local codegen fallback initially.

`styled-system/functions` does not become an extractor `importMap` category. The manifest may expose its module root for
overlay codegen and package validation, but pure-function resolution follows normal package exports.

## Progressive enhancement

Unsupported browsers ignore the `@function` rule and reject declarations containing the unknown call:

```css
.progress {
  width: 75%;
  width: --progression(3, 4);
}
```

Firefox and Safari keep `width: 75%`. Supporting browsers use the second declaration.

Panda cannot currently express two declarations for one property through a normal `SystemStyleObject`; arrays already
mean responsive values. The separate [ordered CSS value fallbacks](./css-value-fallbacks.md) design proposes:

```ts
css({
  width: css.fallback('75%', progression(3, 4)),
})
```

```css
.width_hash {
  width: 75%;
  width: --progression(3, 4);
}
```

That feature keeps the baseline and enhanced declarations as one ordered atom and also works in recipes, slot recipes,
and patterns. It remains independent from custom-function definition and evaluation.

`@supports at-rule(@function)` is not a universal fallback today. The `at-rule()` support query shipped later than
`@function` in Chromium and is also missing from Firefox and Safari.

Until browser support broadens or Panda gains declaration fallbacks:

- treat the presence of `theme.functions` as an explicit experimental opt-in,
- document Chromium-only usage clearly,
- use it where dropping the enhanced declaration is acceptable,
- use handwritten CSS when a baseline declaration is required.

## Compiler flow

```txt
theme.functions
  │
  ├─► config validation
  │
  ├─► type data ──► ArtifactId::Functions
  │                    │
  │                    └─► styled-system/functions
  │
  └─► stylesheet ──► @layer tokens { @function … }

source:
  transparent('brand', 'muted')
       │
       ├─► cross-file pure-function fold
       ├─► resolve known category keys through captured token maps
       ├─► "--transparent(var(--colors-brand), var(--opacity-muted))"
       ├─► normal StyleTree / Literal
       ├─► normal AtomValue
       └─► normal CSS declaration

browser:
  declaration + @function definition
       └─► computed-value-time evaluation
```

## Implementation plan

### Phase 1: native experimental registry

1. Add `CssFunctionDefinition` types and `theme.functions` to `packages/types`.
2. Add `defineCssFunction()` authoring support to `@pandacss/dev`.
3. Add JSON-safe Rust config mirrors.
4. Track `theme.functions` through config sources and diffing.
5. Preserve parameter/body insertion order with `IndexMap` or order-preserving JSON maps.
6. Treat `parameters` and `body` as atomic fields during config merging.
7. Add structural validation and diagnostics.
8. Validate inferred and explicit parameter token categories.
9. Resolve token references in defaults and body values.
10. Emit `@function` blocks in the tokens layer.
11. Cover normal, minified, split, and layer-polyfill output.

### Phase 2: generated helpers

1. Add `ConfigDependency::Functions`; function artifacts also depend on `ConfigDependency::Tokens`.
2. Add `ArtifactId::Functions`.
3. Generate `functions/index` in JS, MJS, and TS modes.
4. Derive native argument types from parameter syntax.
5. Infer unambiguous token categories and honor explicit `token` metadata.
6. Reuse `TokenTypeData`/`TokenValue<T>` for token unions.
7. Generate shared category lookup maps with final CSS variables.
8. Keep runtime helpers inside the pure evaluator subset.
9. Test folding from local paths, tsconfig aliases, package exports, JS, MJS, and TS.
10. Test calls in `css`, JSX props, `cva`, and `sva`.
11. Test config-time calls in `defineRecipe` and `defineSlotRecipe`.
12. Add `sandbox/codegen` coverage.

### Phase 3: design systems

1. Include `theme.functions` in the published preset.
2. Sync the `./functions` package export.
3. Add function ownership to overlay codegen.
4. Add signature compatibility diagnostics.
5. Test app additions, compatible overrides, parent chains, and full-local fallback.
6. Verify hydrated atoms need no build-info schema change.

### Phase 4: fallback exploration

1. Design ordered declaration fallback IR separately.
2. Prototype `css.fallback()` without coupling it to custom functions.
3. Measure CSS-size and extraction costs.
4. Do not ship compile-time function-body substitution as a fallback.

## Test matrix

### Config and validation

- default and explicit CSS names,
- kebab-case and generated export collisions,
- ordered parameter objects,
- duplicate normalized parameter names,
- integer-like parameter names,
- trailing and non-trailing defaults,
- primitive and open syntax strings,
- inferred, explicit, disabled, unknown, and incompatible token categories,
- missing result,
- ordered body entries and repeated descriptor fallbacks,
- nested conditional rules,
- direct and transitive dependency cycles,
- token references in defaults, locals, and results.

### Codegen

- JS + `.d.ts`,
- MJS + extensionless `.d.ts`,
- MJS + explicit `.d.mts`,
- TS-only output,
- zero functions,
- one function,
- multiple functions,
- optional parameters,
- return brands,
- inferred and explicit token categories,
- token-free parameters,
- token-key and raw-value runtime resolution,
- category maps shared across helpers,
- prefix/hash-aware token variables,
- values containing quotes, backslashes, and template-sensitive characters,
- package export sync.

### Extraction and transform

- direct imports,
- aliased imports,
- namespace imports if generated barrels support them,
- local outdir import,
- tsconfig alias,
- design-system package export,
- nested use inside `css`,
- use in template expressions,
- static token arguments,
- CSS-variable arguments,
- dynamic argument bailout,
- dead import cleanup after a fully transformed style call.

### Recipes

- `cva` base/variant/compound values,
- `sva` base/variant/compound values per slot,
- `defineRecipe` using the authoring call builder,
- `defineSlotRecipe` using the authoring call builder,
- generated config recipe CSS,
- eager and smart compound variants,
- hydrated design-system recipes.

### Stylesheet

- tokens-layer placement,
- deterministic definition order,
- exact authored body order,
- minified output,
- split CSS,
- token pruning,
- nested native function calls,
- call-site CSS variables,
- layer-polyfill warning,
- unchanged CSS snapshots when the feature is unused.

## Decisions

| Topic                          | Decision                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Config location                | `theme.functions`                                                              |
| Authoring helper               | `defineCssFunction(name, definition)` with a JSON-safe `.definition`           |
| Generated entry point          | `styled-system/functions`                                                      |
| Runtime behavior               | Thin native call string; browser evaluates the function                        |
| CSS name                       | Stable `cssName`; defaults to `--${kebabCase(key)}`; never prefix/hash-derived |
| Parameter representation       | Insertion-ordered object; key is the logical name; atomic during merging       |
| Parameter token values         | Infer `colors`/`durations`; explicit `token` for ambiguous syntaxes            |
| Body representation            | Insertion-ordered object with `result`, `--*`, and nested `@*`; atomic merge   |
| CSS layer                      | Tokens                                                                         |
| Extractor category             | None; use existing cross-file pure-function folding                            |
| Atom/build-info representation | Existing string value                                                          |
| Dynamic arguments              | Use CSS variables; arbitrary dynamic style calls remain unextractable          |
| Token arguments                | Inferred/explicit category keys in source; `{token.path}` in config            |
| Definition emission            | Always emit initially                                                          |
| Automatic fallback             | Deferred to a general ordered-declaration fallback design                      |
| `@mixin` / `@apply`            | Out of scope                                                                   |
| Rollout                        | Experimental until browser support and fallback policy improve                 |

## Unresolved questions

1. Should `defineCssFunction()` require the logical name, or should a registration helper bind a nameless definition to
   its `theme.functions` key?
2. Should generated return brands participate in strict property-value types, or remain documentation-only metadata?
3. Should the first release allow raw `@container` conditions in function bodies? The platform supports call-site
   container evaluation, but Panda should test its interaction with shadow roots and stylesheet placement first.
4. Should compatible app overrides report an info diagnostic, or remain silent?
5. Should handwritten calls in `globalCss` contribute to future function usage pruning, or should functions remain
   unconditionally emitted?
6. Should `cssList()` ship with the first generated helper API, or wait for demonstrated comma-list usage?
7. Should one parameter accept multiple token categories, such as both `gradients` and `assets` for `<image>`? Bare keys
   can collide, so this needs a qualified-key or deterministic ambiguity policy.

## Related

- [CSS Custom Functions and Mixins Module](https://drafts.csswg.org/css-mixins/)
- [MDN: `@function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function)
- [Codegen design](./codegen-design.md)
- [Literal evaluator](./literal-evaluator.md)
- [Cross-file resolution](./cross-file-resolution.md)
- [Native stylesheet compiler](./stylesheet.md)
- [Ordered CSS value fallbacks](./css-value-fallbacks.md)
- [Design-system manifest](./design-system-manifest.md)
- [Virtual styled-system](./virtual-styled-system.md)
