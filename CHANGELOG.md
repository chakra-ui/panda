# CHANGELOG

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.12.0] - 2023-08-24

## Fixed

- Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- Fix failed styled component for solid-js when using recipe

## Added

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

See the [Changesets](./.changeset) for the latest changes.

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
