# CHANGELOG

All notable changes to this project will be documented in this file.

## [Unreleased]

See the [Changesets](./.changeset) for the latest changes.

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
