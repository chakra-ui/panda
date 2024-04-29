# @pandacss/studio

## 0.38.0

### Patch Changes

- 1e50336: Fix type import
- Updated dependencies [96b47b3]
- Updated dependencies [bc09d89]
- Updated dependencies [2c8b933]
  - @pandacss/types@0.38.0
  - @pandacss/token-dictionary@0.38.0
  - @pandacss/shared@0.38.0
  - @pandacss/config@0.38.0
  - @pandacss/logger@0.38.0
  - @pandacss/astro-plugin-studio@0.38.0

## 0.37.2

### Patch Changes

- b3beef4: Make `WithImportant<T>` more performant and ensure typescript is happy. This changes will make code
  autocompletion and ts-related linting much faster than before.
- Updated dependencies [74dfb3e]
  - @pandacss/types@0.37.2
  - @pandacss/astro-plugin-studio@0.37.2
  - @pandacss/config@0.37.2
  - @pandacss/logger@0.37.2
  - @pandacss/token-dictionary@0.37.2
  - @pandacss/shared@0.37.2

## 0.37.1

### Patch Changes

- 93dc9f5: Public changes: Some quality of life fixes for the Studio:

  - Handle displaying values using the `[xxx]` escape-hatch syntax for `textStyles` in the studio
  - Display an empty state when there's no token in a specific token page in the studio

  ***

  (mostly) Internal changes:

  - Add `deepResolveReference` in TokenDictionary, helpful to get the raw value from a semantic token by recursively
    traversing the token references.
  - Added some exports in the `@pandacss/token-dictionary` package, mostly useful when building tooling around Panda
    (Prettier/ESLint/VSCode plugin etc)

- 885963c: - Fix an issue where the `compoundVariants` classes would not be present at runtime when using
  `config recipes`

  ```ts
  // panda.config.ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    theme: {
      extend: {
        recipes: {
          button: {
            // ...
            variants: {
              size: {
                sm: {
                  fontSize: 'sm',
                },
                // ...
              },
            },
            compoundVariants: [
              {
                size: 'sm',
                css: { color: 'blue.100'},
              },
            ],
          },
        },
      },
    },
  })

  // app.tsx
  const Button = styled('button', button)

  const App = () => {
    return (
      // ❌ this would only have the classes `button button--size_sm`
      // the `text_blue` was missing
      // ✅ it's now fixed -> `button button--size_sm text_blue`
      <Button size="sm">Click me</Button>
    )
  }
  ```

  - Add a `getVariantProps` helper to the recipes API (`cva` and `config recipes`)

  ```ts
  import { cva } from '../styled-system/css'
  import { getVariantProps } from '../styled-system/recipes'

  const button = cva({
      // ...
    variants: {
      size: {
        sm: {
          fontSize: 'sm',
        },
        md: {
          fontSize: 'md',
        },
      },
      variant: {
        primary: {
          backgroundColor: 'blue.500',
        },
        danger: {
          backgroundColor: 'red.500',
        }
      }
    }
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    }
  })

  // ✅ this will return the computed variants based on the defaultVariants + props passed
  const buttonProps = button.getVariantProps({ size: "sm" })
  //    ^? { size: "sm", variant: "primary" }
  ```

- Updated dependencies [93dc9f5]
- Updated dependencies [88049c5]
- Updated dependencies [885963c]
- Updated dependencies [99870bb]
  - @pandacss/token-dictionary@0.37.1
  - @pandacss/config@0.37.1
  - @pandacss/types@0.37.1
  - @pandacss/shared@0.37.1
  - @pandacss/logger@0.37.1
  - @pandacss/astro-plugin-studio@0.37.1

## 0.37.0

### Patch Changes

- Updated dependencies [7daf159]
- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/shared@0.37.0
  - @pandacss/types@0.37.0
  - @pandacss/config@0.37.0
  - @pandacss/token-dictionary@0.37.0
  - @pandacss/logger@0.37.0
  - @pandacss/astro-plugin-studio@0.37.0

## 0.36.1

### Patch Changes

- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1
  - @pandacss/config@0.36.1
  - @pandacss/logger@0.36.1
  - @pandacss/token-dictionary@0.36.1
  - @pandacss/astro-plugin-studio@0.36.1
  - @pandacss/shared@0.36.1

## 0.36.0

### Minor Changes

- fabdabe: ## Changes

  When using `strictTokens: true`, if you didn't have `tokens` (or `semanticTokens`) on a given `Token category`, you'd
  still not be able to use _any_ values in properties bound to that category. Now, `strictTokens` will correctly only
  restrict properties that have values in their token category.

  Example:

  ```ts
  // panda.config.ts

  export default defineConfig({
    // ...
    strictTokens: true,
    theme: {
      extend: {
        colors: {
          primary: { value: "blue" },
        },
        // borderWidths: {}, // ⚠️ nothing defined here
      },
    },
  });
  ```

  ```ts
  // app.tsx
  css({
    // ❌ before this PR, TS would throw an error as you are supposed to only use Tokens
    // even thought you don't have any `borderWidths` tokens defined !

    // ✅ after this PR, TS will not throw an error anymore as you don't have any `borderWidths` tokens
    // if you add one, this will error again (as it's supposed to)
    borderWidths: "123px",
  });
  ```

  ## Description

  - Simplify typings for the style properties.
  - Add the `csstype` comments for each property.

  You will now be able to see a utility or `csstype` values in 2 clicks !

  ## How

  Instead of relying on TS to infer the correct type for each properties, we now just generate the appropriate value for
  each property based on the config.

  This should make it easier to understand the type of each property and might also speed up the TS suggestions as
  there's less to infer.

### Patch Changes

- Updated dependencies [445c7b6]
- Updated dependencies [3af3940]
- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/config@0.36.0
  - @pandacss/token-dictionary@0.36.0
  - @pandacss/types@0.36.0
  - @pandacss/logger@0.36.0
  - @pandacss/astro-plugin-studio@0.36.0
  - @pandacss/shared@0.36.0

## 0.35.0

### Patch Changes

- Updated dependencies [f2fdc48]
- Updated dependencies [50db354]
- Updated dependencies [f6befbf]
- Updated dependencies [a0c4d27]
  - @pandacss/token-dictionary@0.35.0
  - @pandacss/config@0.35.0
  - @pandacss/types@0.35.0
  - @pandacss/logger@0.35.0
  - @pandacss/astro-plugin-studio@0.35.0
  - @pandacss/shared@0.35.0

## 0.34.3

### Patch Changes

- 4576a60: Fix nested `styled` factory composition

  ```tsx
  import { styled } from "../styled-system/jsx";

  const BasicBox = styled("div", { base: { fontSize: "10px" } });
  const ExtendedBox1 = styled(BasicBox, { base: { fontSize: "20px" } });
  const ExtendedBox2 = styled(ExtendedBox1, { base: { fontSize: "30px" } });

  export const App = () => {
    return (
      <>
        {/* ✅ fs_10px */}
        <BasicBox>text1</BasicBox>
        {/* ✅ fs_20px */}
        <ExtendedBox1>text2</ExtendedBox1>
        {/* BEFORE: ❌ fs_10px fs_30px */}
        {/* NOW: ✅ fs_30px */}
        <ExtendedBox2>text3</ExtendedBox2>
      </>
    );
  };
  ```

  - @pandacss/astro-plugin-studio@0.34.3
  - @pandacss/config@0.34.3
  - @pandacss/logger@0.34.3
  - @pandacss/shared@0.34.3
  - @pandacss/token-dictionary@0.34.3
  - @pandacss/types@0.34.3

## 0.34.2

### Patch Changes

- Updated dependencies [58388de]
  - @pandacss/config@0.34.2
  - @pandacss/types@0.34.2
  - @pandacss/astro-plugin-studio@0.34.2
  - @pandacss/logger@0.34.2
  - @pandacss/shared@0.34.2
  - @pandacss/token-dictionary@0.34.2

## 0.34.1

### Patch Changes

- Updated dependencies [d4942e0]
  - @pandacss/token-dictionary@0.34.1
  - @pandacss/astro-plugin-studio@0.34.1
  - @pandacss/config@0.34.1
  - @pandacss/logger@0.34.1
  - @pandacss/shared@0.34.1
  - @pandacss/types@0.34.1

## 0.34.0

### Patch Changes

- Updated dependencies [1c63216]
- Updated dependencies [64d5144]
- Updated dependencies [d1516c8]
- Updated dependencies [9f04427]
  - @pandacss/config@0.34.0
  - @pandacss/token-dictionary@0.34.0
  - @pandacss/types@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/astro-plugin-studio@0.34.0
  - @pandacss/shared@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [34d94cf]
- Updated dependencies [e855c64]
- Updated dependencies [8feeb95]
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/token-dictionary@0.33.0
  - @pandacss/config@0.33.0
  - @pandacss/types@0.33.0
  - @pandacss/astro-plugin-studio@0.33.0
  - @pandacss/logger@0.33.0
  - @pandacss/shared@0.33.0

## 0.32.1

### Patch Changes

- Updated dependencies [a032375]
- Updated dependencies [5184771]
- Updated dependencies [6d8c884]
- Updated dependencies [89ffb6b]
  - @pandacss/config@0.32.1
  - @pandacss/types@0.32.1
  - @pandacss/token-dictionary@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/astro-plugin-studio@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/config@0.32.0
  - @pandacss/token-dictionary@0.32.0
  - @pandacss/logger@0.32.0
  - @pandacss/astro-plugin-studio@0.32.0

## 0.31.0

### Patch Changes

- 8f36f9af: Add a `RecipeVariant` type to get the variants in a strict object from `cva` function. This complements the
  `RecipeVariantprops` type that extracts the variant as optional props, mostly intended for JSX components.
- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [e2ad0eed]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
- Updated dependencies [ddeda8ac]
  - @pandacss/types@0.31.0
  - @pandacss/config@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/token-dictionary@0.31.0
  - @pandacss/astro-plugin-studio@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/config@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/token-dictionary@0.30.2
  - @pandacss/astro-plugin-studio@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- Updated dependencies [ffe177fd]
  - @pandacss/config@0.30.1
  - @pandacss/astro-plugin-studio@0.30.1
  - @pandacss/logger@0.30.1
  - @pandacss/shared@0.30.1
  - @pandacss/token-dictionary@0.30.1
  - @pandacss/types@0.30.1

## 0.30.0

### Patch Changes

- ab32d1d7: Introduce 3 new hooks:

  ## `tokens:created`

  This hook is called when the token engine has been created. You can use this hook to add your format token names and
  variables.

  > This is especially useful when migrating from other css-in-js libraries, like Stitches.

  ```ts
  export default defineConfig({
    // ...
    hooks: {
      'tokens:created': ({ configure }) => {
        configure({
          formatTokenName: (path) => '
  ```

## 0.29.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.29.1
- @pandacss/config@0.29.1
- @pandacss/logger@0.29.1
- @pandacss/shared@0.29.1
- @pandacss/token-dictionary@0.29.1
- @pandacss/types@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [ea3f5548]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/config@0.29.0
  - @pandacss/astro-plugin-studio@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

## 0.28.0

### Patch Changes

- f05f56fd: Allow custom logo in studio
- 7a492d72: Fix issue where throws "React is not defined error"
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
  - @pandacss/config@0.28.0
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/astro-plugin-studio@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/config@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/astro-plugin-studio@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/astro-plugin-studio@0.27.2
- @pandacss/config@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/astro-plugin-studio@0.27.1
  - @pandacss/config@0.27.1
  - @pandacss/token-dictionary@0.27.1
  - @pandacss/logger@0.27.1
  - @pandacss/shared@0.27.1

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
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
- Updated dependencies [c9195a4e]
  - @pandacss/astro-plugin-studio@0.27.0
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/config@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/config@0.26.2
- @pandacss/astro-plugin-studio@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.26.1
- @pandacss/config@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [1bd7fbb7]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/config@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/astro-plugin-studio@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/astro-plugin-studio@0.25.0
  - @pandacss/config@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/config@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/astro-plugin-studio@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.24.1
- @pandacss/config@0.24.1
- @pandacss/logger@0.24.1
- @pandacss/shared@0.24.1
- @pandacss/token-dictionary@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/astro-plugin-studio@0.24.0
  - @pandacss/config@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/astro-plugin-studio@0.23.0
  - @pandacss/config@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 647f05c9: Fix a CSS generation issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with `!` or
  `!important`

  ```ts
  css({
    borderWidth: "[2px!]",
    width: "[2px !important]",
  });
  ```

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/config@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/astro-plugin-studio@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- 11753fea: - Redesign astro integration and studio to use the new Astro v4 (experimental) JavaScript API
  - Update Astro version to v4 for the @pandacss/studio

### Patch Changes

- 1cc8fcff: Fixes a missing bracket in \_indeterminate condition
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/config@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/astro-plugin-studio@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [7f846be2]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/node@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/config@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/config@0.20.1
- @pandacss/node@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/config@0.20.0
  - @pandacss/types@0.20.0
  - @pandacss/node@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/node@0.19.0
  - @pandacss/config@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- a30f660d: Fix issue in studio here userland `@ark-ui/react` version could interfere with studio version
  - @pandacss/node@0.18.3
  - @pandacss/config@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/config@0.18.2
- @pandacss/node@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- aac7b379: Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a
  minChildWidth wasn't interpreted as a token value

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

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/config@0.18.1
  - @pandacss/node@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- b840e469: Improve semantic colors in studio
- Updated dependencies [ba9e32fa]
- Updated dependencies [3010af28]
- Updated dependencies [866c12aa]
  - @pandacss/shared@0.18.0
  - @pandacss/node@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/config@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- abe35313: Fix issue where error is thrown for semantic tokens with raw values.
- Updated dependencies [17f68b3f]
  - @pandacss/node@0.17.5
  - @pandacss/config@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- a031d077: Display semantic colors correctly in studio.
- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/config@0.17.4
  - @pandacss/node@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
- Updated dependencies [60f2c8a3]
  - @pandacss/types@0.17.3
  - @pandacss/node@0.17.3
  - @pandacss/config@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/config@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/node@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 87772c7c: Add `--host` and `--port` flags to studio.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- Updated dependencies [56299cb2]
- Updated dependencies [ddcaf7b2]
- Updated dependencies [5ce359f6]
  - @pandacss/node@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/config@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [dd6811b3]
  - @pandacss/shared@0.17.0
  - @pandacss/node@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/config@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [20f4e204]
- Updated dependencies [36252b1d]
  - @pandacss/node@0.16.0
  - @pandacss/config@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- Updated dependencies [909fcbe8]
  - @pandacss/node@0.15.5
  - @pandacss/config@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
  - @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- 69699ba4: Improved styled factory by adding a 3rd (optional) argument:

  ```ts
  interface FactoryOptions<TProps extends Dict> {
    dataAttr?: boolean;
    defaultProps?: TProps;
    shouldForwardProp?(prop: string, variantKeys: string[]): boolean;
  }
  ```

  - Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name.
    This is useful for testing and debugging.

  ```jsx
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button, { dataAttr: true });

  const App = () => (
    <Button variant="secondary" mt="10px">
      Button
    </Button>
  );
  // Will render something like <button data-recipe="button" class="btn btn--variant_purple mt_10px">Button</button>
  ```

  - `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
    override the default variants or base styles of a recipe.

  ```jsx
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button, {
    defaultProps: {
      variant: "secondary",
      px: "10px",
    },
  });

  const App = () => <Button>Button</Button>;
  // Will render something like <button class="btn btn--variant_secondary px_10px">Button</button>
  ```

  - `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all
    props except recipe variants and style props are forwarded.

  ```jsx
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";
  import { isCssProperty } from "../styled-system/jsx";
  import { motion, isValidMotionProp } from "framer-motion";

  const StyledMotion = styled(
    motion.div,
    {},
    {
      shouldForwardProp: (prop, variantKeys) =>
        isValidMotionProp(prop) ||
        (!variantKeys.includes(prop) && !isCssProperty(prop)),
    },
  );
  ```

- Updated dependencies [abd7c47a]
  - @pandacss/config@0.15.4
  - @pandacss/node@0.15.4
  - @pandacss/types@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: "btn",
    base: { color: "green", fontSize: "16px" },
    variants: {
      size: { small: { fontSize: "14px" } },
    },
    compoundVariants: [{ size: "small", css: { color: "blue" } }],
  });
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button);

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    );
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/node@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/config@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- f3c30d60: Fix issue where studio uses studio config, instead of custom panda config.
- Updated dependencies [f3c30d60]
- Updated dependencies [26a788c0]
- Updated dependencies [2645c2da]
  - @pandacss/node@0.15.2
  - @pandacss/types@0.15.2
  - @pandacss/config@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/node@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/config@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/node@0.15.0
  - @pandacss/config@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/node@0.14.0
  - @pandacss/config@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- 577dcb9d: Fix issue where Panda does not detect styles after nested template in vue
- Updated dependencies [d0fbc7cc]
  - @pandacss/config@0.13.1
  - @pandacss/node@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/node@0.13.0
- @pandacss/config@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/node@0.12.2
- @pandacss/config@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/node@0.12.1
- @pandacss/config@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- 4c8c1715: Export types for all `define` helper functions
- bf2ff391: Add `animationName` utility
  - @pandacss/node@0.12.0
  - @pandacss/config@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

* path.join('-'), }) }, }, })

````

## `utility:created`

This hook is called when the internal classname engine has been created. You can override the default `toHash` function
used when `config.hash` is set to `true`

```ts
export default defineConfig({
  // ...
  hooks: {
    'utility:created': ({ configure }) => {
      configure({
        toHash: (paths, toHash) => {
          const stringConds = paths.join(':')
          const splitConds = stringConds.split('_')
          const hashConds = splitConds.map(toHash)
          return hashConds.join('_')
        },
      })
    },
  },
})
````

## `codegen:prepare`

This hook is called right before writing the codegen files to disk. You can use this hook to tweak the codegen files

```ts
export default defineConfig({
  // ...
  hooks: {
    "codegen:prepare": ({ artifacts, changed }) => {
      // do something with the emitted js/d.ts files
    },
  },
});
```

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

- Updated dependencies [0dd45b6a]
- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [ab32d1d7]
- Updated dependencies [49c760cd]
- Updated dependencies [d5977c24]
  - @pandacss/config@0.30.0
  - @pandacss/types@0.30.0
  - @pandacss/token-dictionary@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/astro-plugin-studio@0.30.0
  - @pandacss/logger@0.30.0

## 0.29.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.29.1
- @pandacss/config@0.29.1
- @pandacss/logger@0.29.1
- @pandacss/shared@0.29.1
- @pandacss/token-dictionary@0.29.1
- @pandacss/types@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [ea3f5548]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/config@0.29.0
  - @pandacss/astro-plugin-studio@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

## 0.28.0

### Patch Changes

- f05f56fd: Allow custom logo in studio
- 7a492d72: Fix issue where throws "React is not defined error"
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
  - @pandacss/config@0.28.0
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/astro-plugin-studio@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/config@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/astro-plugin-studio@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/astro-plugin-studio@0.27.2
- @pandacss/config@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/astro-plugin-studio@0.27.1
  - @pandacss/config@0.27.1
  - @pandacss/token-dictionary@0.27.1
  - @pandacss/logger@0.27.1
  - @pandacss/shared@0.27.1

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
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
- Updated dependencies [c9195a4e]
  - @pandacss/astro-plugin-studio@0.27.0
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/config@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/config@0.26.2
- @pandacss/astro-plugin-studio@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.26.1
- @pandacss/config@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [1bd7fbb7]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/config@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/astro-plugin-studio@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/astro-plugin-studio@0.25.0
  - @pandacss/config@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/config@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/astro-plugin-studio@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.24.1
- @pandacss/config@0.24.1
- @pandacss/logger@0.24.1
- @pandacss/shared@0.24.1
- @pandacss/token-dictionary@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/astro-plugin-studio@0.24.0
  - @pandacss/config@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/astro-plugin-studio@0.23.0
  - @pandacss/config@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 647f05c9: Fix a CSS generation issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with `!` or
  `!important`

  ```ts
  css({
    borderWidth: "[2px!]",
    width: "[2px !important]",
  });
  ```

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/config@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/astro-plugin-studio@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- 11753fea: - Redesign astro integration and studio to use the new Astro v4 (experimental) JavaScript API
  - Update Astro version to v4 for the @pandacss/studio

### Patch Changes

- 1cc8fcff: Fixes a missing bracket in \_indeterminate condition
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/config@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/astro-plugin-studio@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [7f846be2]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/node@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/config@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/config@0.20.1
- @pandacss/node@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/config@0.20.0
  - @pandacss/types@0.20.0
  - @pandacss/node@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/node@0.19.0
  - @pandacss/config@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- a30f660d: Fix issue in studio here userland `@ark-ui/react` version could interfere with studio version
  - @pandacss/node@0.18.3
  - @pandacss/config@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/config@0.18.2
- @pandacss/node@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- aac7b379: Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a
  minChildWidth wasn't interpreted as a token value

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

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/config@0.18.1
  - @pandacss/node@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- b840e469: Improve semantic colors in studio
- Updated dependencies [ba9e32fa]
- Updated dependencies [3010af28]
- Updated dependencies [866c12aa]
  - @pandacss/shared@0.18.0
  - @pandacss/node@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/config@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- abe35313: Fix issue where error is thrown for semantic tokens with raw values.
- Updated dependencies [17f68b3f]
  - @pandacss/node@0.17.5
  - @pandacss/config@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- a031d077: Display semantic colors correctly in studio.
- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/config@0.17.4
  - @pandacss/node@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
- Updated dependencies [60f2c8a3]
  - @pandacss/types@0.17.3
  - @pandacss/node@0.17.3
  - @pandacss/config@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/config@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/node@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 87772c7c: Add `--host` and `--port` flags to studio.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- Updated dependencies [56299cb2]
- Updated dependencies [ddcaf7b2]
- Updated dependencies [5ce359f6]
  - @pandacss/node@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/config@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [dd6811b3]
  - @pandacss/shared@0.17.0
  - @pandacss/node@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/config@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [20f4e204]
- Updated dependencies [36252b1d]
  - @pandacss/node@0.16.0
  - @pandacss/config@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- Updated dependencies [909fcbe8]
  - @pandacss/node@0.15.5
  - @pandacss/config@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
  - @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- 69699ba4: Improved styled factory by adding a 3rd (optional) argument:

  ```ts
  interface FactoryOptions<TProps extends Dict> {
    dataAttr?: boolean;
    defaultProps?: TProps;
    shouldForwardProp?(prop: string, variantKeys: string[]): boolean;
  }
  ```

  - Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name.
    This is useful for testing and debugging.

  ```jsx
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button, { dataAttr: true });

  const App = () => (
    <Button variant="secondary" mt="10px">
      Button
    </Button>
  );
  // Will render something like <button data-recipe="button" class="btn btn--variant_purple mt_10px">Button</button>
  ```

  - `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
    override the default variants or base styles of a recipe.

  ```jsx
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button, {
    defaultProps: {
      variant: "secondary",
      px: "10px",
    },
  });

  const App = () => <Button>Button</Button>;
  // Will render something like <button class="btn btn--variant_secondary px_10px">Button</button>
  ```

  - `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all
    props except recipe variants and style props are forwarded.

  ```jsx
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";
  import { isCssProperty } from "../styled-system/jsx";
  import { motion, isValidMotionProp } from "framer-motion";

  const StyledMotion = styled(
    motion.div,
    {},
    {
      shouldForwardProp: (prop, variantKeys) =>
        isValidMotionProp(prop) ||
        (!variantKeys.includes(prop) && !isCssProperty(prop)),
    },
  );
  ```

- Updated dependencies [abd7c47a]
  - @pandacss/config@0.15.4
  - @pandacss/node@0.15.4
  - @pandacss/types@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: "btn",
    base: { color: "green", fontSize: "16px" },
    variants: {
      size: { small: { fontSize: "14px" } },
    },
    compoundVariants: [{ size: "small", css: { color: "blue" } }],
  });
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button);

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    );
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/node@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/config@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- f3c30d60: Fix issue where studio uses studio config, instead of custom panda config.
- Updated dependencies [f3c30d60]
- Updated dependencies [26a788c0]
- Updated dependencies [2645c2da]
  - @pandacss/node@0.15.2
  - @pandacss/types@0.15.2
  - @pandacss/config@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/node@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/config@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/node@0.15.0
  - @pandacss/config@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/node@0.14.0
  - @pandacss/config@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- 577dcb9d: Fix issue where Panda does not detect styles after nested template in vue
- Updated dependencies [d0fbc7cc]
  - @pandacss/config@0.13.1
  - @pandacss/node@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/node@0.13.0
- @pandacss/config@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/node@0.12.2
- @pandacss/config@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/node@0.12.1
- @pandacss/config@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- 4c8c1715: Export types for all `define` helper functions
- bf2ff391: Add `animationName` utility
  - @pandacss/node@0.12.0
  - @pandacss/config@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0
