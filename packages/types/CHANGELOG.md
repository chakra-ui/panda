# @pandacss/types

## 0.22.1

### Patch Changes

- 8f4ce97c: Fix `slotRecipes` typings,
  [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added to `config.recipes`
  weren't added to `config.slotRecipes`

## 0.22.0

### Patch Changes

- 526c6e34: Fix issue where static-css types was not exported.

## 0.21.0

### Patch Changes

- 5b061615: Add a shortcut for the `config.importMap` option

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

- 105f74ce: Add a way to specify a recipe's `staticCss` options from inside a recipe config, e.g.:

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

## 0.20.1

## 0.20.0

### Minor Changes

- 904aec7b: - Add support for `staticCss` in presets allowing you create sharable, pre-generated styles

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

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change

## 0.19.0

### Patch Changes

- 61831040: Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.

  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)

- 89f86923: Fix issue where css variables were not supported in layer styles and text styles types.

## 0.18.3

## 0.18.2

## 0.18.1

## 0.18.0

## 0.17.5

## 0.17.4

### Patch Changes

- fa77080a: Fix issue where types package was not built correctly.

## 0.17.3

### Patch Changes

- 529a262e: Fix regression in types due to incorrect `package.json` structure

## 0.17.2

## 0.17.1

## 0.17.0

### Patch Changes

- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

## 0.16.0

## 0.15.5

## 0.15.4

## 0.15.3

### Patch Changes

- 1ac2011b: Add a new `config.importMap` option that allows you to specify a custom module specifier to import from
  instead of being tied to the `outdir`

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

- 58743bc4: - Fix `ExtendableUtilityConfig` typings after a regression in 0.15.2 (due to
  https://github.com/chakra-ui/panda/pull/1410)
  - Fix `ExtendableTheme` (specifically make the `RecipeConfig` Partial inside the `theme: { extend: { ... } }` object),
    same for slotRecipes

## 0.15.2

### Patch Changes

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property

## 0.15.1

## 0.15.0

### Patch Changes

- 4bc515ea: Allow `string`s as `zIndex` and `opacity` tokens in order to support css custom properties
- 39298609: Make the types suggestion faster (updated `DeepPartial`)

## 0.14.0

### Minor Changes

- 8106b411: Add `generator:done` hook to perform actions when codegen artifacts are emitted.

### Patch Changes

- e6459a59: The utility transform fn now allow retrieving the token object with the raw value/conditions as currently
  there's no way to get it from there.
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`

## 0.13.1

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable

## 0.11.0

### Patch Changes

- 5b95caf5: Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook)
  dependency

## 0.10.0

### Minor Changes

- a669f4d5: Introduce new slot recipe features.

  Slot recipes are useful for styling composite or multi-part components easily.

  - `sva`: the slot recipe version of `cva`
  - `defineSlotRecipe`: the slot recipe version of `defineRecipe`

  **Definition**

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
  ```

  **Usage**

  ```jsx
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

### Patch Changes

- 24e783b3: Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and
  further reduce it.

  `config.jsxStyleProps`:

  - When set to 'all', all style props are allowed.
  - When set to 'minimal', only the `css` prop is allowed.
  - When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
    - `<styled.div />` and `styled("div")` aren't valid
    - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

- 386e5098: Update `RecipeVariantProps` to support slot recipes

## 0.9.0

### Minor Changes

- c08de87f: ### Breaking

  - Renamed the `name` property of a config recipe to `className`. This is to ensure API consistency and express the
    intent of the property more clearly.

  ```diff
  export const buttonRecipe = defineRecipe({
  -  name: 'button',
  +  className: 'button',
    // ...
  })
  ```

  - Renamed the `jsx` property of a pattern to `jsxName`.

  ```diff
  const hstack = definePattern({
  -  jsx: 'HStack',
  +  jsxName: 'HStack',
    // ...
  })
  ```

  ### Feature

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

## 0.8.0

### Patch Changes

- be0ad578: Fix parser issue with TS path mappings

## 0.7.0

### Patch Changes

- a9c189b7: Fix issue where `splitVariantProps` in cva doesn't resolve the correct types

## 0.6.0

## 0.5.1

### Patch Changes

- 8c670d60: Remove `breakpoints` from Tokens type
- 1ed239cd: Add feature where `config.staticCss.recipes` can now use [`*`] to generate all variants of a recipe.

  before:

  ```ts
  staticCss: {
    recipes: {
      button: [{ size: ['*'], shape: ['*'] }]
    }
  }
  ```

  now:

  ```ts
  staticCss: {
    recipes: {
      button: ['*']
    }
  }
  ```

- 78ed6ed4: Fix issue where using a nested outdir like `src/styled-system` with a baseUrl like `./src` would result on
  parser NOT matching imports like `import { container } from "styled-system/patterns";` cause it would expect the full
  path `src/styled-system`

## 0.5.0

### Minor Changes

- ead9eaa3: Add support for tagged template literal version.

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

## 0.4.0

### Minor Changes

- 5b344b9c: Add support for disabling shorthand props

  ```ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    // ...
    shorthands: false,
  })
  ```

### Patch Changes

- c7b42325: Add types for supported at-rules (`@media`, `@layer`, `@container`, `@supports`, and `@page`)

## 0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

## 0.0.2

### Patch Changes

- c308e8be: Allow asynchronous presets
- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.

- Updated dependencies [fb40fff2]
  - @pandacss/extractor@0.0.2
