# CHANGELOG

All notable changes to this project will be documented in this file.

See the [Changesets](./.changeset) for the latest changes.

## [Unreleased]

## [0.16.0] - 2023-10-15

### Fixed

- Correct typings for Qwik components

### Added

- Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
- Add closed condition `&:is([closed], [data-closed], [data-state="closed"])`
- Adds a new `--minimal` flag for the CLI on the `panda cssgen` command to skip generating CSS for theme tokens,
  preflight, keyframes, static and global css

Thich means that the generated CSS will only contain the CSS related to the styles found in the included files.

> Note that you can use a `glob` to override the `config.include` option like this:
> `panda cssgen "src/**/*.css" --minimal`

This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

Use it like this:

```bash
panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
```

In addition to the optional `glob` that you can already pass to override the config.include option, the `panda cssgen`
command now accepts a new `{type}` argument to generate only a specific type of CSS:

- preflight
- tokens
- static
- global
- keyframes

> Note that this only works when passing an `--outfile`.

You can use it like this:

```bash
panda cssgen "static" --outfile dist/static.css
```

## [0.15.5] - 2023-10-4

### Fixed

- Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`.
- **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events to the
  underlying element.
- **Vue**: Fix regression in generated types
- **Preact**: Fix regression in generated types

## [0.15.4] - 2023-09-29

### Fixed

- Fix preset merging, config wins over presets.
- Fix issues with class merging in the `styled` factory fn for Qwik, Solid and Vue.
- Fix static extraction of the [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax)
  when used with runtime conditions

Given a component like this:

```ts
function App() {
  return <Box py={[2, verticallyCondensed ? 2 : 3, 4]} />
}
```

the `py` value was incorrectly extracted like this:

```ts
 {
    "py": {
        "1": 2,
    },
},
{
    "py": {
        "1": 3,
    },
},
```

which would then generate invalid CSS like:

```css
.paddingBlock\\\\:1_2 {
  1: 2px;
}

.paddingBlock\\\\:1_3 {
  1: 3px;
}
```

it's now correctly transformed back to an array:

```diff
{
  "py": {
-    "1": 2,
+   [
+       undefined,
+       2,
+   ]
  },
},
{
  "py": {
-    "1": 3,
+   [
+       undefined,
+       3,
+   ]
  },
},
```

which will generate the correct CSS

```css
@media screen and (min-width: 40em) {
  .sm\\\\:py_2 {
    padding-block: var(--spacing-2);
  }

  .sm\\\\:py_3 {
    padding-block: var(--spacing-3);
  }
}
```

### Added

Improved styled factory by adding a 3rd (optional) argument:

```ts
interface FactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: TProps
  shouldForwardProp?(prop: string, variantKeys: string[]): boolean
}
```

- Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name. This
  is useful for testing and debugging.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button, { dataAttr: true })

const App = () => (
  <Button variant="secondary" mt="10px">
    Button
  </Button>
)
// Will render something like <button data-recipe="button" class="btn btn--variant_purple mt_10px">Button</button>
```

- `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
  override the default variants or base styles of a recipe.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button, {
  defaultProps: {
    variant: 'secondary',
    px: '10px',
  },
})

const App = () => <Button>Button</Button>
// Will render something like <button class="btn btn--variant_secondary px_10px">Button</button>
```

- `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all props
  except recipe variants and style props are forwarded.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { isCssProperty } from '../styled-system/jsx'
import { motion, isValidMotionProp } from 'framer-motion'

const StyledMotion = styled(
  motion.div,
  {},
  {
    shouldForwardProp: (prop, variantKeys) =>
      isValidMotionProp(prop) || (!variantKeys.includes(prop) && !isCssProperty(prop)),
  },
)
```

## [0.15.3] - 2023-09-27

### Fixed

- Fix issue where HMR does not work for Vue JSX factory and patterns
- Fix issue in template literal mode where media queries doesn't work
- Fix `ExtendableUtilityConfig` typings after a regression in 0.15.2 (due to
  https://github.com/chakra-ui/panda/pull/1410)
- Fix `ExtendableTheme` (specifically make the `RecipeConfig` Partial inside the `theme: { extend: { ... } }` object),
  same for slotRecipes

### Added

- Add a new `config.importMap` option that allows you to specify a custom module specifier to import from instead of
  being tied to the `outdir`

You can now do things like leverage the native package.json
[`imports`](https://nodejs.org/api/packages.html#subpath-imports):

```ts
export default defineConfig({
  outdir: './outdir',
  importMap: {
    css: '#panda/styled-system/css',
    recipes: '#panda/styled-system/recipes',
    patterns: '#panda/styled-system/patterns',
    jsx: '#panda/styled-system/jsx',
  },
})
```

Or you could also make your outdir an actual package from your monorepo:

```ts
export default defineConfig({
  outdir: '../packages/styled-system',
  importMap: {
    css: '@monorepo/styled-system',
    recipes: '@monorepo/styled-system',
    patterns: '@monorepo/styled-system',
    jsx: '@monorepo/styled-system',
  },
})
```

Working with tsconfig paths aliases is easy:

```ts
export default defineConfig({
  outdir: 'styled-system',
  importMap: {
    css: 'styled-system/css',
    recipes: 'styled-system/recipes',
    patterns: 'styled-system/patterns',
    jsx: 'styled-system/jsx',
  },
})
```

### Changed

Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory, example below

With this config recipe:

```ts file="panda.config.ts"
const button = defineRecipe({
  className: 'btn',
  base: { color: 'green', fontSize: '16px' },
  variants: {
    size: { small: { fontSize: '14px' } },
  },
  compoundVariants: [{ size: 'small', css: { color: 'blue' } }],
})
```

This would previously not merge the `color` property overrides, but now it does:

```tsx file="example.tsx"
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button)

function App() {
  return (
    <>
      <Button size="small" color="red.100">
        Click me
      </Button>
    </>
  )
}
```

- Before: `btn btn--size_small text_blue text_red.100`
- After: `btn btn--size_small text_red.100`

## [0.15.2] - 2023-09-26

### Fixed

- Fix issue where studio uses studio config, instead of custom panda config.

### Added

- Update supported panda config extensions
- Create custom partial types for each config object property

When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`). Sometimes TS will
complain about types not being exported.

- Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

```
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
```

- Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

```
src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
```

- Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

```
 "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
```

### Changed

- Switch to interface for runtime types
- BREAKING CHANGE: Presets merging order felt wrong (left overriding right presets) and is now more intuitive (right
  overriding left presets)

> Note: This is only relevant for users using more than 1 custom defined preset that overlap with each other.

Example:

```ts
const firstConfig = definePreset({
  theme: {
    tokens: {
      colors: {
        'first-main': { value: 'override' },
      },
    },
    extend: {
      tokens: {
        colors: {
          orange: { value: 'orange' },
          gray: { value: 'from-first-config' },
        },
      },
    },
  },
})

const secondConfig = definePreset({
  theme: {
    tokens: {
      colors: {
        pink: { value: 'pink' },
      },
    },
    extend: {
      tokens: {
        colors: {
          blue: { value: 'blue' },
          gray: { value: 'gray' },
        },
      },
    },
  },
})

// Final config
export default defineConfig({
  presets: [firstConfig, secondConfig],
})
```

Here's the difference between the old and new behavior:

```diff
{
  "theme": {
    "tokens": {
      "colors": {
        "blue": {
          "value": "blue"
        },
-        "first-main": {
-          "value": "override"
-        },
        "gray": {
-          "value": "from-first-config"
+          "value": "gray"
        },
        "orange": {
          "value": "orange"
        },
+        "pink": {
+            "value": "pink",
+        },
      }
    }
  }
}
```

## [0.15.1] - 2023-09-19

### Fixed

- Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- Fix issue in css reset where number input field spinner still show.
- Fix issue where slot recipe breaks when `slots` is `undefined`

### Added

- Reuse css variable in semantic token alias
- Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

```js
import { css } from '../styled-system/css'

const className = css({
  '@media screen and (min-width: token(sizes.4xl))': {
    color: 'green.400',
  },
})
```

- Extract {fn}.raw as an identity fn

so this will now work:

```ts
import { css } from 'styled-system/css'

const paragraphSpacingStyle = css.raw({
  '&:not(:first-child)': { marginBlockEnd: '1em' },
})

export const proseCss = css.raw({
  maxWidth: '800px',
  '& p': {
    '&:not(:first-child)': { marginBlockStart: '1em' },
  },
  '& h1': paragraphSpacingStyle,
  '& h2': paragraphSpacingStyle,
})
```

- Use ECMA preset for ts-evaluator: This means that no other globals than those that are defined in the ECMAScript spec
  such as Math, Promise, Object, etc, are available but it allows for some basic evaluation of expressions like this:

```ts
import { cva } from '.panda/css'

const variants = () => {
  const spacingTokens = Object.entries({
    s: 'token(spacing.1)',
    m: 'token(spacing.2)',
    l: 'token(spacing.3)',
  })

  const spacingProps = {
    px: 'paddingX',
    py: 'paddingY',
  }

  // Generate variants programmatically
  return Object.entries(spacingProps)
    .map(([name, styleProp]) => {
      const variants = spacingTokens
        .map(([variant, token]) => ({ [variant]: { [styleProp]: token } }))
        .reduce((_agg, kv) => ({ ..._agg, ...kv }))

      return { [name]: variants }
    })
    .reduce((_agg, kv) => ({ ..._agg, ...kv }))
}

const baseStyle = cva({
  variants: variants(),
})
```

## [0.15.0] - 2023-09-13

### Fixed

- Fix issue (https://github.com/chakra-ui/panda/issues/1365) with the `unbox` fn that removed nullish values, which
  could be useful for the [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax)

```ts
const className = css({
  color: ['black', undefined, 'orange', 'red'],
})
```

- Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()` with
  `const button = cva({ ... })`)
- Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Fix issue where the `satisfies` would prevent an object from being extracted
- Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when using `Regex`
  in the `jsx` field of a config, resulting in some style props missing.

### Added

- Allow `string`s as `zIndex` and `opacity` tokens in order to support css custom properties

### Changed

- Refactor: Prefer `NativeElements` type for vue jsx elements
- Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher specificity
- Make the types suggestion faster (updated `DeepPartial`)

## [0.14.0] - 2023-09-05

### Fixed

- Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- Fix issue where negative spacing tokens doesn't respect hash option
- Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token were left
  unchanged (due to the `.`)

**Before:**

```css
* {
  color: token(colors.magenta, pink);
}
```

**Now**:

```css
* {
  color: token('colors.magenta', pink);
}
```

### Added

- Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like with
  `{cvaFn}.raw`
- The utility transform fn now allow retrieving the token object with the raw value/conditions as currently there's no
  way to get it from there.
- Add `generator:done` hook to perform actions when codegen artifacts are emitted.
- Add each condition raw value information on hover using JSDoc annotation
- Add missing types (PatternConfig, RecipeConfig, RecipeVariantRecord) to solve a TypeScript issue (The inferred type of
  xxx cannot be named without a reference...)
- Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The inferred
  type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- Introduces deep nested `colorPalettes` for enhanced color management
- Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
  improved organization

**Example**: Define colors within categories, variants and states

```js
const theme = {
  extend: {
    semanticTokens: {
      colors: {
        button: {
          dark: {
            value: 'navy',
          },
          light: {
            DEFAULT: {
              value: 'skyblue',
            },
            accent: {
              DEFAULT: {
                value: 'cyan',
              },
              secondary: {
                value: 'blue',
              },
            },
          },
        },
      },
    },
  },
}
```

You can now use the root `button` color palette and its values directly:

```tsx
import { css } from '../styled-system/css'

export const App = () => {
  return (
    <button
      className={css({
        colorPalette: 'button',
        color: 'colorPalette.light',
        backgroundColor: 'colorPalette.dark',
        _hover: {
          color: 'colorPalette.light.accent',
          background: 'colorPalette.light.accent.secondary',
        },
      })}
    >
      Root color palette
    </button>
  )
}
```

Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

```tsx
import { css } from '../styled-system/css'

export const App = () => {
  return (
    <button
      className={css({
        colorPalette: 'button.light.accent',
        color: 'colorPalette.secondary',
      })}
    >
      Nested color palette leaf
    </button>
  )
}
```

### Changed

- Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it. This is
  mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would use it
  like `css({ ... }, cssProps)`
- Change the `css.raw` function signature to match the one from [`css()`](https://github.com/chakra-ui/panda/pull/1264),
  to allow passing multiple style objects that will be smartly merged.

## [0.13.1] - 2023-08-29

### Fixed

- Fix issue where Panda does not detect styles after nested template in vue
- Fix issue where `cva` is undefined in preact styled factory

### Added

- Allow `.mts` and `.cts` panda config extension
- Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type definition
  files. This is useful for projects that use `moduleResolution: node16` which requires explicit file extensions in
  imports/exports.
  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

## [0.13.0] - 2023-08-26

### Fixed

- Fix issue where `panda --minify` does not work.
- Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme` type.
- Fix an issue with custom JSX components not finding their matching patterns.

### Added

- Add support for minification in `cssgen` command.

## [0.12.2] - 2023-08-25

### Fixed

- Fix bug in generated js code for atomic slot recipe where `splitVariantProps` didn't work without the first slot key.

### Changed

- Change the `css` function signature to allow passing multiple style objects that will be smartly merged, and revert
  the `cx` method to string concatenation behaviour.

```diff
import { css, cx } from '../styled-system/css'

const App = () => {
  return (
    <>
-      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
+      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
        Will result in `class="mx_10 pt_6"`
      </div>
    </>
  )
}
```

- To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

```tsx filename="src/components/Button.tsx"
import { css } from '../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css({ display: 'flex', alignItem: 'center', color: 'black' }, cssProp)
  return <button className={className}>{children}</button>
}
```

Then you can use the `Button` component like this:

```tsx filename="src/app/page.tsx"
import { Button, Thingy } from './Button'

export default function Page() {
  return (
    <Button css={{ color: 'pink', _hover: { color: 'red' } }}>
      will result in `class="d_flex items_center text_pink hover:text_red"`
    </Button>
  )
}
```

- Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
- Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments passed
  in. This is to allow the `css` function to merge the styles correctly.

The new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects to be merged as expected in any
situation.

**Pattern Example:**

```tsx filename="src/components/Button.tsx"
import { hstack } from '../styled-system/patterns'
import { css, cva } from '../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  // using the flex pattern
  const hstackProps = hstack.raw({
    border: '1px solid',
    _hover: { color: 'blue.400' },
  })

  // merging the styles
  const className = css(hstackProps, cssProp)

  return <button className={className}>{children}</button>
}
```

**CVA Example:**

```tsx filename="src/components/Button.tsx"
import { css, cva } from '../styled-system/css'

const buttonRecipe = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' },
    },
  },
})

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css(
    // using the button recipe
    buttonRecipe.raw({ variant: 'primary' }),

    // adding style overrides (internal)
    { _hover: { color: 'blue.400' } },

    // adding style overrides (external)
    cssProp,
  )

  return <button className={className}>{props.children}</button>
}
```

## [0.12.1] - 2023-08-24

### Fixed

- Fix issue where `AnimationName` type was generated wrongly if no keyframes were resolved in the config.

## [0.12.0] - 2023-08-24

### Fixed

- Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- Fix failed styled component for solid-js when using recipe

### Added

- Add interactive flag to `panda init` command. This flag allows you to run the init command in interactive mode.

```sh
panda init -i
```

![panda init interactive mode](https://github.com/chakra-ui/panda/assets/30869823/0ae28a54-bfce-44dc-a314-c0f795c1da3b)

- Add `defineUtility` method. This method allows you to define custom utilities in your config.

```ts
import { defineUtility, defineConfig } from '@pandacss/dev'

const appearance = defineUtility({
  className: 'appearance',
  transform(value) {
    return { appearance: value, WebkitAppearance: value }
  },
})

export default defineConfig({
  utilities: {
    appearance,
  },
})
```

- Add `animationName` utility. This utility connects to your keyframes.

## [0.11.1] - 2023-08-16

### Fixed

Add missing svg props types.

### Added

Add new `layers` key to config, to make layers customizable.

Example:

**In Config**:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  layers: {
    utilities: 'panda_utilities',
  },
})
```

**In global css**:

```diff
- @layer reset, base, tokens, recipes, utilities;
+ @layer reset, base, tokens, recipes, panda_utilities;
```

Doing this:

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return <div className={css({ color: 'blue.500' })} />
}
```

Results in:

```css
@layer panda_utilities {
  .text_blue\.500 {
    color: var(--colors-blue-500);
  }
}
```

### Changed

Make the `cx` smarter by merging and deduplicating the styles passed in.

Example:

```tsx
import { css, cx } from '../styled-system/css'

export function Page() {
  return (
    <div class={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>Will result in "mx_10 pt_6"</div>
  )
}
```

## [0.11.0] - 2023-08-11

### Fixed

- Fix regression where style property with multiple shorthand did not generate the correct className
- Normalize tsconfig path mapping to ensure consistency across platforms
- Fix issue where some style properties shows TS error when using `!important`

### Added

- Add new visually hidden and bleed patterns.

  **Bleed** is a layout pattern is used to negate the padding applied to a parent container. You can apply an `inline`
  or `block` bleed to a child element, setting its value to match the parent's padding.

  ```tsx
  import { css } from '../styled-system/css'
  import { bleed } from '../styled-system/patterns'

  export function Page() {
    return (
      <div class={css({ px: '6' })}>
        <div class={bleed({ inline: '6' })}>Welcome</div>
      </div>
    )
  }
  ```

  **Visually hidden** is a layout pattern used to hide content visually, but still make it available to screen readers.

  ```tsx
  import { css } from '../styled-system/css'
  import { visuallyHidden } from '../styled-system/patterns'

  export function Checkbox() {
    return (
      <label>
        <input type="checkbox" class={visuallyHidden()}>
          I'm hidden
        </input>
        <span>Checkbox</span>
      </label>
    )
  }
  ```

- Add support for optional `glob` argument in the `panda cssgen` command. It is useful when you need to extract the css
  of specific pages in your application.

  > This argument overrides the `include` config option.

  ```sh
  panda cssgen app/ecommerce/**/*.tsx -o ecommerce.css
  ```

- Added a new hook for when the final `styles.css` content has been generated. This is useful when you need to do
  something with the final CSS content.

  ```ts filename=panda.config.ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    hooks: {
      'generator:css'(file, content) {
        if (file === 'styles.css') {
          // do something with the final css content
        }
      },
    },
  })
  ```

### Changed

- Removed the `@pandacss/dev/astro` entrypoint in favor of installing `@pandacss/astro` package
- Automatically inject the entry css `@layer` in `@pandacss/astro` removing the need to manually setup a css file.

## [0.10.0] - 2023-08-07

### Fixed

- Reduce the size of the generated JS code by ~30% by optimizing the generated code.
  > Check [this PR](https://github.com/chakra-ui/panda/pull/1115) to see the details.
- Fix issue in `staticCss` where recipe css generation does not work when recipe includes only `base` (no `variants`)
- Fix issue where `opacity` property is not connected to the `opacity` tokens

### Added

#### Slot Recipes

Introduce new slot recipe features to define recipes that can be used to style composite or multi-part components
easily.

- `sva`: the slot recipe version of `cva`
- `defineSlotRecipe`: the slot recipe version of `defineRecipe`

**Atomic Slot Recipe**

Use the `sva` function to define atomic slot recipes.

```jsx
import { sva } from 'styled-system/css'

const button = sva({
  slots: ['label', 'icon'],
  base: {
    label: { color: 'red', textDecoration: 'underline' },
  },
  variants: {
    rounded: {
      true: {},
    },
    size: {
      sm: {
        label: { fontSize: 'sm' },
        icon: { fontSize: 'sm' },
      },
      lg: {
        label: { fontSize: 'lg' },
        icon: { fontSize: 'lg', color: 'pink' },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})

export function App() {
  const btnClass = button({ size: 'lg', rounded: true })

  return (
    <button>
      <p class={btnClass.label}> Label</p>
      <p class={btnClass.icon}> Icon</p>
    </button>
  )
}
```

**Config Slot Recipe**

Use the `defineSlotRecipe` function to define slot recipes in your config.

```ts filename=panda.config.ts
import { defineConfig, defineSlotRecipe } from '@pandacss/dev'

export default defineConfig({
  theme: {
    slotRecipes: {
      button: defineSlotRecipe({
        className: 'button',
        slots: ['label', 'icon'],
        base: {
          label: { color: 'red', textDecoration: 'underline' },
        },
        variants: {
          rounded: {
            true: {},
          },
          size: {
            sm: {
              label: { fontSize: 'sm' },
              icon: { fontSize: 'sm' },
            },
            lg: {
              label: { fontSize: 'lg' },
              icon: { fontSize: 'lg', color: 'pink' },
            },
          },
        },
        defaultVariants: {
          size: 'sm',
        },
      }),
    },
  },
})
```

Here's how you can use the config slot recipe in your JSX code. The classnames generated by the slot recipe are added to
the `recipes` cascade layer.

```jsx
import { button } from 'styled-system/recipes'

export function App() {
  const btnClass = button({ size: 'lg', rounded: true })

  return (
    <button>
      <p class={btnClass.label}> Label</p>
      <p class={btnClass.icon}> Icon</p>
    </button>
  )
}
```

#### JSX Style Props

Add `jsxStyleProps` config option for controlling how JSX style props are handled in Panda. It helps to significantly
reducing the bundle size of the generated JS code by using the `jsxStyleProps` config option.

This config option supports 3 values:

- `all`: All CSS properties can be used as JSX style props. This is the default value.

```ts filename=panda.config.ts
export default defineConfig({
  jsxStyleProps: 'all',
})
```

```jsx
import { styled } from 'styled-system/jsx'

const Example = () => {
  // all CSS properties + css prop are allowed
  return <Box bg="red.400" color="white" css={{...}} />
}
```

- `minimal`: Only the `css` prop can be used as JSX style props. This reduced the generated JS bundle size by ~45%.

```ts filename=panda.config.ts
export default defineConfig({
  jsxStyleProps: 'minimal',
})
```

```jsx
import { styled } from 'styled-system/jsx'

const Example = () => {
  // only the `css` prop is allowed
  return <Box css={{ bg: 'red.400', color: 'white' }} />
}
```

- `none`: No CSS properties can be used as JSX style props. This reduced the generated JS bundle size by ~48%.

```ts filename=panda.config.ts
export default defineConfig({
  jsxStyleProps: 'none',
})
```

> Check [this PR](https://github.com/chakra-ui/panda/pull/1115) to see the details.

### Changed

Update Panda preset conditions:

- `_checked` now supports `[data-state=checked]`
- `_expanded` now supports `[data-state=expanded]`
- `_indeterminate` now supports `[data-state=indeterminate]`
- `_open` now supports `[data-open]` and `[data-state=open]`

## [0.9.0] - 2023-07-28

### Fixed

- Fix issue where extractor did not consider `true` and `false` branch when using tenary operator
- Fix issue where postcss plugin did not respect the `cwd` option in the panda config
- Fix issue where `asset` tokens generated invalid css variable

### Added

Update the `jsx` property to be used for advanced tracking of custom pattern components.

```jsx
import { Circle } from 'styled-system/jsx'

const CustomCircle = ({ children, ...props }) => {
  return <Circle {...props}>{children}</Circle>
}
```

To track the `CustomCircle` component, you can now use the `jsx` property.

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  patterns: {
    extend: {
      circle: {
        jsx: ['CustomCircle'],
      },
    },
  },
})
```

### Changed

- **BREAKING:** Renamed the `name` property of a config recipe to `className`. This is to ensure API consistency and
  express the intent of the property more clearly.

```diff
export const buttonRecipe = defineRecipe({
-  name: 'button',
+  className: 'button',
  // ...
})
```

> Update your config to use the new `className` property and run `panda codegen --clean` to update the generated code.

- **BREAKING:** Renamed the `jsx` property of a pattern to `jsxName`.

```diff
const hstack = definePattern({
-  jsx: 'HStack',
+  jsxName: 'HStack',
  // ...
})
```

> Update your config to use the new `jsxName` property and run `panda codegen --clean` to update the generated code.

## [0.8.0] - 2023-07-25

### Fixed

- Fix issue where `panda init` with `jsxFramework` flag generated invalid object due to missing comma.
- Fix issue where composite tokens in semantic tokens generated invalid css.
- Fix issue where extractor doesn't work reliably due to `typescript` module version mismatch.
- Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`

### Added

- Added new flags to the `panda cssgen` and `panda ship` command:

  - `-w, --watch` flag to watch for changes
  - `-o` shortcut for `--outfile`

- Introduce the new `{fn}.raw()` method to css, patterns and recipes. This function is an identity function and only
  serves as a hint for the extractor to extract the css.

  It can be useful, for example, in Storybook args or custom react props.

```tsx
// mark the object as valid css for the extractor
<Button rootProps={css.raw({ bg: 'red.400' })} />
```

```tsx
export const Funky: Story = {
  // mark this as a button recipe usage
  args: button.raw({
    visual: 'funky',
    shape: 'circle',
    size: 'sm',
  }),
}
```

### Changed

- Improve virtual color processing to avoid generated unused css variables.
- Improve generated react jsx types to remove legacy ref
- Temporarily disable VSCode extension in `.svelte` or `.vue` files

## [0.7.0] - 2023-07-17

### Fixed

- Fix postcss issue where `@layer reset, base, tokens, recipes, utilities` check was too strict
- Fix parser issue in `.vue` files, make the traversal check nested elements instead of only checking the 1st level
- Fix issue where slash could not be used in token name
- Improve module detection and hot module reloading in the PostCSS plugin when external files are changed
- Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Fix issue where `zIndex` tokens are not connected to zIndex utility

### Changed

- Refactor `transition` utility to improve DX of adding transition. Transitions will now add a default transition
  property, timing function and duration. This allows you to add transitions with a single property.

```jsx
<div className={css({ transition: 'background' })}>Content</div>
```

This will generate the following css:

```css
.transition_background {
  transition-property: background, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

## [0.6.0] - 2023-07-08

### Fixed

- Fix type issue with the `definePattern` function
- Fix issue where `panda cssgen --outfile` doesn't extract files to chunks before bundling them into the css out file
- Fix issue where `gridRows` has the wrong `className`
- Fix issue where `gridItem` pattern did not use the `colStart` and `rowStart` values
- Fix issue where unitless grid properties were converted to pixel values
- Fix issue where `_even` and `_odd` map to incorrect selectors
- Fix issue where `--config` flag doesn't work for most commands.
- Fix issue where `css` prop was not extracted correctly in JSX elements

### Added

- Add negative fraction values to `translateX` and `translateY` utilities
- Export `isCssProperty` helper function from `styled-system/jsx` entrypoint
- Add support for using multiple config rcipes in the same component

### Changed

## [0.5.1] - 2023-07-02

### Fixed

- Fix issue where `panda studio` command doesn't work outside of panda's monorepo.

- Fix parser issue where operation tokens like `1/2` was not detected.

- Improved Svelte file parsing algorithm to support more edge cases.

- Improved config dependency and imported file detection.

### Added

- Add support for `--outfile` flag in the `cssgen` command.

```bash
panda cssgen --outfile dist/styles.css
```

- Add feature where `config.staticCss.recipes` can now use [`*`] to generate all variants of a recipe.

```ts
staticCss: {
  recipes: {
    button: ['*']
  }
}
```

### Changed

- Refactored all conditions to use `:is` selector to improve specificity and reduce the reliance on css order.

## [0.5.0] - 2023-06-26

### Fixed

- Fix issue where escaping classname doesn't work when class starts with number.

### Added

- Add support for tagged template literal version.

  This features is pure css approach to writing styles, and can be a great way to migrate from styled-components and
  emotion.

  Set the `syntax` option to `template-literal` in the panda config to enable this feature.

  ```js
  // panda.config.ts
  export default defineConfig({
    //...
    syntax: 'template-literal',
  })
  ```

  > For existing projects, you might need to run the `panda codegen --clean`

  You can also use the `--syntax` option to specify the syntax type when using the CLI.

  ```sh
  panda init -p --syntax template-literal
  ```

To get autocomplete for token variables, consider using the
[CSS Var Autocomplete](https://marketplace.visualstudio.com/items?itemName=phoenisx.cssvar) extension.

### Changed

- Update the default color palette to match Tailwind's new palette.

## [0.4.0] - 2023-06-19

### Fixed

- Fix issue here divider pattern generated incorrect css in horizontal orientation
- Fix issue where aspect ratio css property adds `px`
- Fix placeholder condition to map to `&::placeholder`
- Fix issue where patterns that include css selectors doesn't work in JSX
- Fix issue where the `panda ship` command does not write to the correct path

### Added

- Experimental support for native `.vue` files and `.svelte` files
- Add types for supported at-rules (`@media`, `@layer`, `@container`, `@supports`, and `@page`)
- Add webkit polyfill for common properties to reduce the need for `autoprefixer`
- Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```sh
  panda codegen --watch
  ```

- Add support for disabling shorthand props

  ```ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    // ...
    shorthands: false,
  })
  ```

### Changed

- Add `auto` value where neccessary to base utilities.
- Add `0` value to default spacing tokens to allow for `strictTokens` mode.

## [0.3.2] - 2023-06-16

### Added

- Add support for config path in cli commands via the `--config` or `-c` flag.

  ```bash
  panda init --config ./pandacss.config.js
  ```

- Add support for setting config path in postcss

  ```js
  module.exports = {
    plugins: [
      require('@pandacss/postcss')({
        configPath: './path/to/panda.config.js',
      }),
    ],
  }
  ```

### Changed

- Remove `bundledDependencies` from `package.json` to fix NPM resolution

## [0.3.1] - 2023-06-16

Baseline Release 🎉
