# CHANGELOG

All notable changes to this project will be documented in this file.

## [Unreleased]

See the [Changesets](./.changeset) for the latest changes.

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
