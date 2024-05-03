# @pandacss/postcss

## 0.39.0

### Patch Changes

- @pandacss/node@0.39.0

## 0.38.0

### Patch Changes

- Updated dependencies [2c8b933]
  - @pandacss/node@0.38.0

## 0.37.2

### Patch Changes

- Updated dependencies [84edd38]
  - @pandacss/node@0.37.2

## 0.37.1

### Patch Changes

- @pandacss/node@0.37.1

## 0.37.0

### Patch Changes

- @pandacss/node@0.37.0

## 0.36.1

### Patch Changes

- @pandacss/node@0.36.1

## 0.36.0

### Patch Changes

- @pandacss/node@0.36.0

## 0.35.0

### Minor Changes

- 888feae: Add `allow` config option in postcss plugin.

  The plugin won't parse css files in node modules. This config option lets you opt out of that for some paths.

  ```js
  //postcss.config.cjs

  module.exports = {
    plugins: {
      "@pandacss/dev/postcss": {
        allow: [/node_modules\/.embroider/],
      },
    },
  };
  ```

### Patch Changes

- @pandacss/node@0.35.0

## 0.34.3

### Patch Changes

- @pandacss/node@0.34.3

## 0.34.2

### Patch Changes

- @pandacss/node@0.34.2

## 0.34.1

### Patch Changes

- @pandacss/node@0.34.1

## 0.34.0

### Patch Changes

- @pandacss/node@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [1968da5]
  - @pandacss/node@0.33.0

## 0.32.1

### Patch Changes

- Updated dependencies [89ffb6b]
  - @pandacss/node@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [de4d9ef]
  - @pandacss/node@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [f0296249]
- Updated dependencies [2d69b340]
- Updated dependencies [ddeda8ac]
  - @pandacss/node@0.31.0

## 0.30.2

### Patch Changes

- @pandacss/node@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/node@0.30.1

## 0.30.0

### Patch Changes

- d5977c24: - Add a `--logfile` flag to the `panda`, `panda codegen`, `panda cssgen` and `panda debug` commands.

  - Add a `logfile` option to the postcss plugin

  Logs will be streamed to the file specified by the `--logfile` flag or the `logfile` option. This is useful for
  debugging issues that occur during the build process.

  ```sh
  panda --logfile ./logs/panda.log
  ```

  ```js
  module.exports = {
    plugins: {
      "@pandacss/dev/postcss": {
        logfile: "./logs/panda.log",
      },
    },
  };
  ```

- Updated dependencies [05686b9d]
- Updated dependencies [ab32d1d7]
- Updated dependencies [d5977c24]
  - @pandacss/node@0.30.0

## 0.29.1

### Patch Changes

- Updated dependencies [a5c75607]
  - @pandacss/node@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [a2fb5cc6]
  - @pandacss/node@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f58f6df2]
- Updated dependencies [f255342f]
  - @pandacss/node@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
- Updated dependencies [39d10c79]
  - @pandacss/node@0.27.3

## 0.27.2

### Patch Changes

- Updated dependencies [bfa8b1ee]
  - @pandacss/node@0.27.2

## 0.27.1

### Patch Changes

- ee9341db: Fix issue in windows environments where HMR doesn't work in webpack projects.
- Updated dependencies [ee9341db]
  - @pandacss/node@0.27.1

## 0.27.0

### Minor Changes

- 84304901: Improve performance, mostly for the CSS generation by removing a lot of `postcss` usage (and plugins).

  ## Public changes:

  - Introduce a new `config.lightningcss` option to use `lightningcss` (currently disabled by default) instead of
    `postcss`.
  - Add a new `config.browserslist` option to configure the browserslist used by `lightningcss`.
  - Add a `--lightningcss` flag to the `panda` and `panda cssgen` command to use `lightningcss` instead of `postcss` for
    this run.

  ## Internal changes:

  - `markImportant` fn from JS instead of walking through postcss AST nodes
  - use a fork of `stitches` `stringify` function instead of `postcss-css-in-js` to write the CSS string from a JS
    object
  - only compute once `TokenDictionary` properties
  - refactor `serializeStyle` to use the same code path as the rest of the pipeline with `StyleEncoder` / `StyleDecoder`
    and rename it to `transformStyles` to better convey what it does

### Patch Changes

- Updated dependencies [84304901]
  - @pandacss/node@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/node@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/node@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [1bd7fbb7]
- Updated dependencies [1bd7fbb7]
  - @pandacss/node@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [bc154358]
  - @pandacss/node@0.25.0

## 0.24.2

### Patch Changes

- @pandacss/node@0.24.2

## 0.24.1

### Patch Changes

- Updated dependencies [10e74428]
  - @pandacss/node@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [63b3f1f2]
  - @pandacss/node@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [1ea7459c]
- Updated dependencies [383b6d1b]
- Updated dependencies [840ed66b]
  - @pandacss/node@0.23.0

## 0.22.1

### Patch Changes

- 0f7793c7: Fix a regression with the @pandacss/astro integration where the automatically provided `base.css` would be
  ignored by the @pandacss/postcss plugin
  - @pandacss/node@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [a2f6c2c8]
- Updated dependencies [11753fea]
  - @pandacss/node@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [7f846be2]
  - @pandacss/node@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/node@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
  - @pandacss/node@0.20.0

## 0.19.0

### Patch Changes

- @pandacss/node@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/node@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/node@0.18.2

## 0.18.1

### Patch Changes

- @pandacss/node@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [3010af28]
- Updated dependencies [866c12aa]
  - @pandacss/node@0.18.0

## 0.17.5

### Patch Changes

- Updated dependencies [17f68b3f]
  - @pandacss/node@0.17.5

## 0.17.4

### Patch Changes

- @pandacss/node@0.17.4
- @pandacss/symlink@0.17.4

## 0.17.3

### Patch Changes

- 128e0b19: Fix an issue with the Postcss builder config change detection, which triggered unnecessary a rebuild of the
  artifacts.
- Updated dependencies [60f2c8a3]
  - @pandacss/node@0.17.3
  - @pandacss/symlink@0.17.3

## 0.17.2

### Patch Changes

- 443ac85a: Fix an issue with the CLI, using the dev mode instead of the prod mode even when installed from npm.

  This resolves the following errors:

  ```
   Error: Cannot find module 'resolve.exports'
  ```

  ```
  Error: Cannot find module './src/cli-main'
  ```

- Updated dependencies [443ac85a]
  - @pandacss/symlink@0.17.2
  - @pandacss/node@0.17.2

## 0.17.1

### Patch Changes

- 56299cb2: Fix persistent error that causes CI builds to fail due to PostCSS plugin emitting artifacts in the middle of
  a build process.
- Updated dependencies [56299cb2]
- Updated dependencies [ddcaf7b2]
  - @pandacss/node@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [dd6811b3]
  - @pandacss/node@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [20f4e204]
- Updated dependencies [36252b1d]
  - @pandacss/node@0.16.0

## 0.15.5

### Patch Changes

- Updated dependencies [909fcbe8]
  - @pandacss/node@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/node@0.15.4

## 0.15.3

### Patch Changes

- @pandacss/node@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [f3c30d60]
  - @pandacss/node@0.15.2

## 0.15.1

### Patch Changes

- @pandacss/node@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [39298609]
  - @pandacss/node@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
  - @pandacss/node@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/node@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/node@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/node@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/node@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/node@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/node@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [cde9702e]
  - @pandacss/node@0.11.0

## 0.10.0

### Patch Changes

- @pandacss/node@0.10.0

## 0.9.0

### Patch Changes

- f10e706a: Fix PostCSS edge-case where the config file is not in the app root
- Updated dependencies [f10e706a]
  - @pandacss/node@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [5d1d376b]
- Updated dependencies [be0ad578]
- Updated dependencies [78612d7f]
  - @pandacss/node@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f4bb0576]
- Updated dependencies [d8ebaf2f]
- Updated dependencies [4ff7ddea]
  - @pandacss/node@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [032c152a]
  - @pandacss/node@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [5b09ab3b]
- Updated dependencies [78ed6ed4]
- Updated dependencies [e48b130a]
- Updated dependencies [1a2c0e2b]
  - @pandacss/node@0.5.1

## 0.5.0

### Patch Changes

- @pandacss/node@0.5.0

## 0.4.0

### Patch Changes

- @pandacss/node@0.4.0

## 0.3.2

### Patch Changes

- 24b78f7c: Add support for setting config path in postcss

  ```js
  module.exports = {
    plugins: [
      require("@pandacss/postcss")({
        configPath: "./path/to/panda.config.js",
      }),
    ],
  };
  ```

  - @pandacss/node@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/node@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [b8ab0868]
  - @pandacss/node@0.3.0
