# @pandacss/config

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/preset-base@0.22.1
  - @pandacss/preset-panda@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [1cc8fcff]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/preset-base@0.22.0
  - @pandacss/preset-panda@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/preset-base@0.21.0
  - @pandacss/preset-panda@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- Updated dependencies [428e5401]
  - @pandacss/preset-base@0.20.1
  - @pandacss/error@0.20.1
  - @pandacss/logger@0.20.1
  - @pandacss/preset-panda@0.20.1
  - @pandacss/shared@0.20.1
  - @pandacss/types@0.20.1

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
- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/preset-base@0.20.0
  - @pandacss/preset-panda@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/preset-base@0.19.0
  - @pandacss/preset-panda@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/error@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/preset-base@0.18.3
- @pandacss/preset-panda@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies [3e1ea626]
  - @pandacss/preset-base@0.18.2
  - @pandacss/error@0.18.2
  - @pandacss/logger@0.18.2
  - @pandacss/preset-panda@0.18.2
  - @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [ce34ea45]
- Updated dependencies [aac7b379]
  - @pandacss/preset-base@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/preset-panda@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- @pandacss/types@0.18.0
- @pandacss/error@0.18.0
- @pandacss/logger@0.18.0
- @pandacss/preset-base@0.18.0
- @pandacss/preset-panda@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/error@0.17.5
- @pandacss/logger@0.17.5
- @pandacss/preset-base@0.17.5
- @pandacss/preset-panda@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/preset-base@0.17.4
  - @pandacss/preset-panda@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/preset-base@0.17.3
  - @pandacss/preset-panda@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/error@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/preset-base@0.17.2
- @pandacss/preset-panda@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- @pandacss/types@0.17.1
- @pandacss/error@0.17.1
- @pandacss/logger@0.17.1
- @pandacss/preset-base@0.17.1
- @pandacss/preset-panda@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [fc4688e6]
  - @pandacss/types@0.17.0
  - @pandacss/preset-base@0.17.0
  - @pandacss/preset-panda@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [0f3bede5]
  - @pandacss/preset-base@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/preset-panda@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/error@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/preset-base@0.15.5
- @pandacss/preset-panda@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- abd7c47a: Fix preset merging, config wins over presets.
  - @pandacss/types@0.15.4
  - @pandacss/error@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/preset-base@0.15.4
  - @pandacss/preset-panda@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/types@0.15.3
  - @pandacss/preset-base@0.15.3
  - @pandacss/preset-panda@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 2645c2da: > Note: This is only relevant for users using more than 1 custom defined preset that overlap with each
  other.

  BREAKING CHANGE: Presets merging order felt wrong (left overriding right presets) and is now more intuitive (right
  overriding left presets)

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

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/preset-base@0.15.2
  - @pandacss/preset-panda@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2

## 0.15.1

### Patch Changes

- @pandacss/types@0.15.1
- @pandacss/error@0.15.1
- @pandacss/logger@0.15.1
- @pandacss/preset-base@0.15.1
- @pandacss/preset-panda@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [39298609]
  - @pandacss/types@0.15.0
  - @pandacss/preset-base@0.15.0
  - @pandacss/preset-panda@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/preset-base@0.14.0
  - @pandacss/preset-panda@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0

## 0.13.1

### Patch Changes

- d0fbc7cc: Allow `.mts` and `.cts` panda config extension
- Updated dependencies [d0fbc7cc]
  - @pandacss/error@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/preset-base@0.13.1
  - @pandacss/preset-panda@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/preset-base@0.13.0
- @pandacss/preset-panda@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/preset-base@0.12.2
- @pandacss/preset-panda@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/preset-base@0.12.1
- @pandacss/preset-panda@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [bf2ff391]
  - @pandacss/preset-base@0.12.0
  - @pandacss/error@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/preset-panda@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/types@0.11.1
  - @pandacss/preset-base@0.11.1
  - @pandacss/preset-panda@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- dead08a2: Normalize tsconfig path mapping result to posix path.

  It fix not generating pattern styles on windows eventually.

- Updated dependencies [5b95caf5]
- Updated dependencies [811f4fb1]
  - @pandacss/types@0.11.0
  - @pandacss/preset-base@0.11.0
  - @pandacss/preset-panda@0.11.0
  - @pandacss/error@0.11.0
  - @pandacss/logger@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [24e783b3]
- Updated dependencies [00d11a8b]
- Updated dependencies [1972b4fa]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/types@0.10.0
  - @pandacss/preset-base@0.10.0
  - @pandacss/preset-panda@0.10.0
  - @pandacss/error@0.10.0
  - @pandacss/logger@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/preset-base@0.9.0
  - @pandacss/types@0.9.0
  - @pandacss/preset-panda@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0

## 0.8.0

### Patch Changes

- e1f6318a: Fix module resolution issue when using panda from a browser environment
- be0ad578: Fix parser issue with TS path mappings
- Updated dependencies [be0ad578]
  - @pandacss/preset-base@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/preset-panda@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0

## 0.7.0

### Patch Changes

- 1a05c4bb: Fix issue where hot module reloading is inconsistent in the PostCSS plugin when another internal
  typescript-only package is changed
- Updated dependencies [60a77841]
- Updated dependencies [a9c189b7]
- Updated dependencies [d9eeba60]
  - @pandacss/preset-base@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/preset-panda@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [97fbe63f]
- Updated dependencies [08d33e0f]
- Updated dependencies [f7aff8eb]
  - @pandacss/preset-base@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/preset-panda@0.6.0

## 0.5.1

### Patch Changes

- 33198907: Create separate entrypoint for merge configs

  ```ts
  import { mergeConfigs } from '@pandacss/config/merge'
  ```

- 1a2c0e2b: Fix `panda.config.xxx` file dependencies detection when using the builder (= with PostCSS or with the VSCode
  extension). It will now also properly resolve tsconfig path aliases.
- Updated dependencies [8c670d60]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/preset-base@0.5.1
  - @pandacss/preset-panda@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [ead9eaa3]
- Updated dependencies [3a87cff8]
  - @pandacss/types@0.5.0
  - @pandacss/preset-panda@0.5.0
  - @pandacss/preset-base@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [e8024347]
- Updated dependencies [d00eb17c]
- Updated dependencies [9156c1c6]
- Updated dependencies [54a8913c]
- Updated dependencies [0f36ebad]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/preset-base@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/preset-panda@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0

## 0.3.2

### Patch Changes

- 9822d79a: Remove `bundledDependencies` from `package.json` to fix NPM resolution
  - @pandacss/error@0.3.2
  - @pandacss/logger@0.3.2
  - @pandacss/preset-base@0.3.2
  - @pandacss/preset-panda@0.3.2
  - @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/preset-base@0.3.1
  - @pandacss/preset-panda@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [bd5c049b]
- Updated dependencies [6d81ee9e]
  - @pandacss/preset-base@0.3.0
  - @pandacss/preset-panda@0.3.0
  - @pandacss/types@0.3.0
  - @pandacss/error@0.3.0
  - @pandacss/logger@0.3.0

## 0.0.2

### Patch Changes

- c308e8be: Allow asynchronous presets
- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.

- Updated dependencies [c308e8be]
- Updated dependencies [fb40fff2]
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
