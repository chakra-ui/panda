# @pandacss/studio

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

- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/node@0.10.0
  - @pandacss/config@0.10.0
  - @pandacss/logger@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
- Updated dependencies [f10e706a]
  - @pandacss/types@0.9.0
  - @pandacss/node@0.9.0
  - @pandacss/config@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- be0ad578: Fix parser issue with TS path mappings
- Updated dependencies [5d1d376b]
- Updated dependencies [ac078416]
- Updated dependencies [e1f6318a]
- Updated dependencies [be0ad578]
- Updated dependencies [78612d7f]
  - @pandacss/node@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/config@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f4bb0576]
- Updated dependencies [f59154fb]
- Updated dependencies [d8ebaf2f]
- Updated dependencies [a9c189b7]
- Updated dependencies [4ff7ddea]
- Updated dependencies [1a05c4bb]
  - @pandacss/node@0.7.0
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/config@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 239fe41a: Fix token-analyzer page when no unknown tokens find in a project
- 76419e3e: Fix studio build while using pnpm or linking dependencies
- Updated dependencies [032c152a]
  - @pandacss/node@0.6.0
  - @pandacss/config@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 773565c4: Fix studio usage outside of panda's monorepo
- Updated dependencies [5b09ab3b]
- Updated dependencies [8c670d60]
- Updated dependencies [33198907]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
- Updated dependencies [e48b130a]
- Updated dependencies [1a2c0e2b]
  - @pandacss/node@0.5.1
  - @pandacss/types@0.5.1
  - @pandacss/config@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/token-dictionary@0.5.1

## 0.5.0

### Patch Changes

- 3a87cff8: Update the color palette to match Tailwind's new palette.
- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/node@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/config@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- d00eb17c: Add `auto` value where neccessary to base utilities.
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/config@0.4.0
  - @pandacss/node@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- 65d3423f: Improve studio UI
- Updated dependencies [9822d79a]
  - @pandacss/config@0.3.2
  - @pandacss/node@0.3.2
  - @pandacss/logger@0.3.2
  - @pandacss/shared@0.3.2
  - @pandacss/token-dictionary@0.3.2
  - @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- 22ec328e: Improve studio UI
- Updated dependencies [efd79d83]
  - @pandacss/config@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/node@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [b8ab0868]
- Updated dependencies [6d81ee9e]
  - @pandacss/node@0.3.0
  - @pandacss/types@0.3.0
  - @pandacss/config@0.3.0
  - @pandacss/token-dictionary@0.3.0
  - @pandacss/logger@0.3.0
  - @pandacss/shared@0.3.0
