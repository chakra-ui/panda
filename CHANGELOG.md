# CHANGELOG

All notable changes to this project will be documented in this file.

See the [Changesets](./.changeset) for the latest changes.

## [Unreleased]

## [0.25.0] - 2024-01-06

### Fixed

- Fix config dependencies detection by re-introducing the file tracing utility
- Fix issue where `base` doesn't work within css function

```jsx
css({
  // This didn't work, but now it does
  base: { color: 'blue' },
})
```

## Added

- Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    recipes: '*', // ✅ will generate the staticCss for all recipes
  },
})
```

- Support token reference syntax when authoring styles object, text styles and layer styles.

```jsx
import { css } from '../styled-system/css'

const styles = css({
  border: '2px solid {colors.primary}',
})
```

This will resolve the token reference and convert it to css variables.

```css
.border_2px_solid_\{colors\.primary\} {
  border: 2px solid var(--colors-primary);
}
```

The alternative to this was to use the `token(...)` css function which will be resolved.

### `token(...)` vs `{...}`

Both approaches return the css variable

```jsx
const styles = css({
  // token reference syntax
  border: '2px solid {colors.primary}',
  // token function syntax
  border: '2px solid token(colors.primary)',
})
```

However, The `token(...)` syntax allows you to set a fallback value.

```jsx
const styles = css({
  border: '2px solid token(colors.primary, red)',
})
```

## [0.24.2] - 2024-01-04

### Fixed

- Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being seen as a
  truthy value
- Fix an issue with the `panda init` command which didn't update existing `.gitignore` to include the `styled-system`
- Fix issue where config slot recipes with compound variants were not processed correctly

## [0.24.1] - 2024-01-02

### Fixed

- Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS wasn't
  applied correctly
- Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
  through the config recipes)

## [0.24.0] - 2024-01-02

### Fixed

- Fix regression in previous implementation that increased memory usage per extraction, leading to slower performance
  over time

### Added

Add `patterns` to `config.staticCss`

### Changed

- Boost style extraction performance by moving more work away from postcss
- Using a hashing strategy, the compiler only computes styles/classname once per style object and prop-value-condition
  pair
- Fix the special `[*]` rule which used to generate the same rule for every breakpoints, which is not what most people
  need (it's still possible by explicitly using `responsive: true`).

```ts
const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
    visual: {
      primary: { backgroundColor: 'blue' },
      secondary: { backgroundColor: 'gray' },
    },
  },
})

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: ['*'], // this

      // was equivalent to:
      card: [
        // notice how `responsive: true` was implicitly added
        { size: ['*'], responsive: true },
        { visual: ['*'], responsive: true },
      ],

      //   will now correctly be equivalent to:
      card: [{ size: ['*'] }, { visual: ['*'] }],
    },
  },
})
```

Here's the diff in the generated CSS:

```diff
@layer recipes {
  .card--size_small {
    font-size: 14px;
  }

  .card--size_large {
    font-size: 18px;
  }

  .card--visual_primary {
    background-color: blue;
  }

  .card--visual_secondary {
    background-color: gray;
  }

  @layer _base {
    .card {
      color: var(--colors-white);
    }
  }

-  @media screen and (min-width: 40em) {
-    -.sm\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.sm\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.sm\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.sm\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 48em) {
-    -.md\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.md\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.md\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.md\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 64em) {
-    -.lg\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.lg\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.lg\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.lg\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 80em) {
-    -.xl\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.xl\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.xl\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.xl\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 96em) {
-    -.\32xl\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.\32xl\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.\32xl\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.\32xl\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }
}
```

## [0.23.0] - 2023-12-15

### Fixed

- Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal` or `none`
  with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Fix performance issue where process could get slower due to postcss rules held in memory.
- Fix an issue with the postcss plugin when a config change sometimes didn't trigger files extraction
- Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal parsing
  when not using `config.syntax` set to "template-literal"
- Fix a parser issue where we didn't handle import aliases when using a {xxx}.raw() function.

ex:

```ts
// button.stories.ts
import { button as buttonRecipe } from '@ui/styled-system/recipes'

export const Primary: Story = {
  // ❌ this wouldn't be parsed as a recipe because of the alias + .raw()
  //  -> ✅ it's now fixed
  args: buttonRecipe.raw({
    color: 'primary',
  }),
}
```

### Added

- Add support for emit-pkg command to emit just the `package.json` file with the required entrypoints. If an existing
  `package.json` file is present, the `exports` field will be updated.

When setting up Panda in a monorepo, this command is useful in monorepo setups where you want the codegen to run only in
a dedicated workspace package.

- Automatically extract/generate CSS for `sva` even if `slots` are not statically extractable, since it will only
  produce atomic styles, we don't care much about slots for `sva` specifically

Currently the CSS won't be generated if the `slots` are missing which can be problematic when getting them from another
file, such as when using `Ark-UI` like `import { comboboxAnatomy } from '@ark-ui/anatomy'`

```ts
import { sva } from '../styled-system/css'
import { slots } from './slots'

const card = sva({
  slots, // ❌ did NOT work -> ✅ will now work as expected
  base: {
    root: {
      p: '6',
      m: '4',
      w: 'md',
      boxShadow: 'md',
      borderRadius: 'md',
      _dark: { bg: '#262626', color: 'white' },
    },
    content: {
      textStyle: 'lg',
    },
    title: {
      textStyle: 'xl',
      fontWeight: 'semibold',
      pb: '2',
    },
  },
})
```

### Changed

- Log stacktrace on error instead of only logging the message

## [0.22.1] - 2023-12-15

### Fixed

- Fix `slotRecipes` typings, [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added
  to `config.recipes` weren't added to `config.slotRecipes`
- Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

```ts
css({
  bg: '[#3B00B9]', // ✅ was okay
  _dark: {
    // ✅ was okay
    color: '[#3B00B9]',
  },

  // ❌ Not okay, will be fixed in this patch
  color: {
    _dark: '[#3B00B9]',
  },
})
```

- Fix a regression with the @pandacss/astro integration where the automatically provided `base.css` would be ignored by
  the @pandacss/postcss plugin

- Fix a CSS generation issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with `!` or
  `!important`

```ts
css({
  borderWidth: '[2px!]',
  width: '[2px !important]',
})
```

## [0.22.0] - 2023-12-14

### Fixed

- Fix issue where static-css types was not exported.
- Fix conditional variables in border radii
- Fix regression where `styled-system/jsx/index` had the wrong exports
- Fix potential cross-platform issues with path resolving by using `pathe` instead of `path`
- Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Fixes a missing bracket in \_indeterminate condition
- Fix issue where array syntax did not generate reponsive values in mapped pattern properties

### Changed

- Update csstype to support newer css features
- Redesign astro integration and studio to use the new Astro v4 (experimental) JavaScript API
- Update Astro version to v4 for the @pandacss/studio

- Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

## [0.21.0] - 2023-12-09

### Fixed

- Fix static extraction issue when using JSX attributes (props) that are other JSX nodes

While parsing over the AST Nodes, due to an optimization where we skipped retrieving the current JSX element and instead
kept track of the latest one, the logic was flawed and did not extract other properties after encountering a JSX
attribute that was another JSX node.

```tsx
const Component = () => {
  return (
    <>
      {/* ❌ this wasn't extracting ml="2" */}
      <Flex icon={<svg className="icon" />} ml="2" />

      {/* ✅ this was fine */}
      <Stack ml="4" icon={<div className="icon" />} />
    </>
  )
}
```

Now both will be fine again.

- Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains an URL.

```tsx
const App = () => {
  // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
  // but since it's an URL, it would produce invalid CSS
  // we now check if the property value is an URL and skip it if needed
  return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />
}
```

- Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the normalization that
  happens internally.
- Fix issue where Preact JSX types are not merging recipes correctly
- Fix vue `styled` factory internal class merging, for example:

```js
<script setup>
import { styled } from '../styled-system/jsx'

const StyledButton = styled('button', {
  base: {
    bgColor: 'red.300',
  },
})
</script>
<template>
  <StyledButton id="test" class="test">
    <slot></slot>
  </StyledButton>
</template>
```

Will now correctly include the `test` class in the final output.

### Added

- Add `configPath` and `cwd` options in the `@pandacss/astro` integration just like in the `@pandacss/postcss`

> This can be useful with Nx monorepos where the `panda.config.ts` is not in the root of the project.

- Add an escape-hatch for arbitrary values when using `config.strictTokens`, by prefixing the value with `[` and
  suffixing with `]`, e.g. writing `[123px]` as a value will bypass the token validation.

```ts
import { css } from '../styled-system/css'

css({
  // @ts-expect-error TS will throw when using from strictTokens: true
  color: '#fff',
  // @ts-expect-error TS will throw when using from strictTokens: true
  width: '100px',

  // ✅ but this is now allowed:
  bgColor: '[rgb(51 155 240)]',
  fontSize: '[12px]',
})
```

- Add a shortcut for the `config.importMap` option

You can now also use a string to customize the base import path and keep the default entrypoints:

```json
{
  "importMap": "@scope/styled-system"
}
```

is the equivalent of:

```json
{
  "importMap": {
    "css": "@scope/styled-system/css",
    "recipes": "@scope/styled-system/recipes",
    "patterns": "@scope/styled-system/patterns",
    "jsx": "@scope/styled-system/jsx"
  }
}
```

- Add a way to specify a recipe's `staticCss` options from inside a recipe config, e.g.:

```js
import { defineRecipe } from '@pandacss/dev'

const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
  },
  staticCss: [{ size: ['*'] }],
})
```

would be the equivalent of defining it inside the main config:

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: {
        size: ['*'],
      },
    },
  },
})
```

- Add Open Props preset

## [0.20.1] - 2023-12-01

### Fixed

- Fix issue where conditional recipe variant doesn't work as expected
- Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

```ts
css({
  '@container (min-width: token(sizes.xl))': {
    color: 'green.300',
  },
  '@media (min-width: token(sizes.2xl))': {
    color: 'red.300',
  },
})
```

### Added

- Add a --watch flag to the `panda ship` command
- Add support for granular config change detection
- Improve the `codegen` experience by only rewriting files affecteds by a config change
- Added `strokeWidth` to svg utilities.
- Connected `outlineWidth` utility to `borderWidths` token.
- Add `borderWidth`, `borderTopWidth`, `borderLeftWidth`, `borderRightWidth`, `borderBottomWidth` to berder utilities.
- Add support for `staticCss` in presets allowing you create sharable, pre-generated styles
- Add support for extending `staticCss` defined in presets

```jsx
const presetWithStaticCss = definePreset({
  staticCss: {
    recipes: {
      // generate all button styles and variants
      button: ['*'],
    },
  },
})

export default defineConfig({
  presets: [presetWithStaticCss],
  staticCss: {
    extend: {
      recipes: {
        // extend and pre-generate all sizes for card
        card: [{ size: ['small', 'medium', 'large'] }],
      },
    },
  },
})
```

## [0.19.0] - 2023-11-24

### Fixed

- Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.
  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)
- Fix issue in preflight where monospace fallback pointed to the wrong variable
- Fix issue where css variables were not supported in layer styles and text styles types.
- Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache not being
  cleared as needed.

### Changed

- Require explicit installation of `@pandacss/studio` to use the `panda studio` command.
- Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for the
  property 'display') and throwing when using anything else than those, if no theme tokens was found on that property.

Before:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ❌ didn't throw even though 'abc' is not a valid value for 'display'
```

Now:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ✅ will throw since 'abc' is not a valid value for 'display'
```

## [0.18.3] - 2023-11-15

### Fixed

- Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
- Fix issue in studio here userland `@ark-ui/react` version could interfere with studio version

## [0.18.2] - 2023-11-10

### Fixed

- Fix regression in grid pattern where `columns` doesn't not work as expected.

## [0.18.1] - 2023-11-09

### Fixed

- Fix issue where virtual color does not apply DEFAULT color in palette
- Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax in
  semantic tokens.
- Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints
- Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a minChildWidth wasn't
  interpreted as a token value

Before:

```tsx
<div className={grid({ minChildWidth: '80px', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

<div className={grid({ minChildWidth: '20', gap: 8 })} />
// ❌ grid-template-columns: repeat(auto-fit, minmax(20, 1fr))
//                                                  ^^^
```

After:

```tsx
<div className={grid({ minChildWidth: '80px', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

<div className={grid({ minChildWidth: '20', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(var(--sizes-20, 20), 1fr))
//                                                  ^^^^^^^^^^^^^^^^^^^
```

```jsx
css({ hideBelow: 'lg' })
// => @media screen and (max-width: 63.9975em) { background: red; }
```

### Added

- Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

```jsx
css({ hideFrom: '800px' })
// => @media screen and (min-width: 800px) { background: red; }
```

### Changed

- Make `_required`condition target `[data-required]` and `[aria-required=true]` attributes

## [0.18.0] - 2023-11-06

### Fixed

- Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Fix CLI interactive mode `syntax` question values and prettify the generated `panda.config.ts` file
- Improve semantic colors in studio

### Added

- Add a `--only-config` flag for the `panda debug` command, to skip writing app files and just output the resolved
  config.
- Add `--strict-tokens` flag and question in the interactive CLI
- Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

```tsx
import { splitCssProps, styled } from '../styled-system/jsx'
import type { HTMLStyledProps } from '../styled-system/types'

function SplitComponent({ children, ...props }: HTMLStyledProps<'div'>) {
  const [cssProps, restProps] = splitCssProps(props)
  return (
    <styled.div {...restProps} className={css({ display: 'flex', height: '20', width: '20' }, cssProps)}>
      {children}
    </styled.div>
  )
}

// Usage

function App() {
  return <SplitComponent margin="2">Click me</SplitComponent>
}
```

### Changed

- Perf: use raw `if` instead of ts-pattern in the extractor (hot path)

## [0.17.5] - 2023-10-31

### Fixed

- Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- Fix issue where error is thrown for semantic tokens with raw values.
- Fix issue where using array syntax in config recipe generates invalid css
- Fix issue where cva composition in styled components doens't work as expected.

### Changed

- Ensure dir exists before writing file for the `panda cssgen` / `panda ship` / `panda analyze` commands when specifying
  an outfile.

## [0.17.4] - 2023-10-30

### Fixed

- Display semantic colors correctly in studio.
- Fix issue where types package was not built correctly.

## [0.17.3] - 2023-10-28

### Fixed

- Fix regression in types due to incorrect `package.json` structure
- Fix issue in studio command where `fs-extra` imports could not be resolved.
- Fix an issue with the Postcss builder config change detection, which triggered unnecessary a rebuild of the artifacts.

### CHanged

- Mark `defineTokens` and `defineSemanticTokens` with pure annotation to treeshake from bundle when using within
  component library.

## [0.17.2] - 2023-10-27

### Fixed

Fix an issue with the CLI, using the dev mode instead of the prod mode even when installed from npm.

This resolves the following errors:

```
 Error: Cannot find module 'resolve.exports'
```

```
Error: Cannot find module './src/cli-main'
```

## [0.17.1] - 2023-10-26

### Fixed

- Fix persistent error that causes CI builds to fail due to PostCSS plugin emitting artifacts in the middle of a build
  process.
- Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- Fix issue in reset styles where button does not inherit color style
- Fix issue where FileSystem writes cause intermittent errors in different build contexts (Vercel, Docker). This was
  solved by limiting the concurrency using the `p-limit` library
- Fix issue where using scale css property adds an additional 'px'
- Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM

### Added

- Add `--host` and `--port` flags to studio.

### Changed

- Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`
- Remove export types from jsx when no jsxFramework configuration
- Extract identifier values coming from an `EnumDeclaration` member

Example:

```ts
enum Color {
  Red = 'red.400',
  Blue = 'blue.400',
}

const className = css({ color: Color.Red, backgroundColor: Color['Blue'] })
```

- Use predefined interfaces instead of relying on automatic TS type inference or type aliases. This should result in
  snappier

This should fix issues with the generation of typescript declaration (`.d.ts`) files when using `@pandacss/xxx` packages
directly, such as:

```
src/config.ts(21,14): error TS2742: The inferred type of 'tokens' cannot be named without a reference to '../node_modules/@pandacss/types/src/shared'. This is likely not portable. A type annotation is necessa…
```

> These changes are only relevant if you are directly using **other** Panda `@pandacss/xxx` packages than the
> `@pandacss/dev`.

## [0.17.0] - 2023-10-20

### Fixed

- Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`

### Added

- Improve support for styled element composition. This ensures that you can compose two styled elements together and the
  styles will be merged correctly.

```jsx
const Box = styled('div', {
  base: {
    background: 'red.light',
    color: 'white',
  },
})

const ExtendedBox = styled(Box, {
  base: { background: 'red.dark' },
})

// <ExtendedBox> will have a background of `red.dark` and a color of `white`
```

**Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when an
element is created from a cva/inline cva, and another created from a config recipe.

- CVA or Inline CVA + CVA or Inline CVA = ✅
- Config Recipe + Config Recipe = ✅
- CVA or Inline CVA + Config Recipe = ❌

```jsx
import { button } from '../styled-system/recipes'

const Button = styled('div', button)

// ❌ This will throw an error
const ExtendedButton = styled(Button, {
  base: { background: 'red.dark' },
})
```

- Export all types from @pandacss/types, which will also export all types exposed in the outdir/types. Also make the
  `config.prefix` object Partial so that each key is optional.
- Apply `config.logLevel` from the Panda config to the logger in every context. Fixes
  https://github.com/chakra-ui/panda/issues/1451
- Automatically add each recipe slots to the `jsx` property, with a dot notation

```ts
const button = defineSlotRecipe({
  className: 'button',
  slots: ['root', 'icon', 'label'],
  // ...
})
```

will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Added a new type to extract variants out of styled components

```tsx
import { StyledVariantProps } from '../styled-system/jsx'

const Button = styled('button', {
  base: { color: 'black' },
  variants: {
    state: {
      error: { color: 'red' },
      success: { color: 'green' },
    },
  },
})

type ButtonVariantProps = StyledVariantProps<typeof Button>
//   ^ { state?: 'error' | 'success' | undefined }
```

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
