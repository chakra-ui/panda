# @pandacss/shared

## 0.13.1

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.1

### Patch Changes

- c07e1beb: Make the `cx` smarter by merging and deduplicating the styles passed in

  Example:

  ```tsx
  <h1 className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>Will result in "mx_10 pt_6"</h1>
  ```

## 0.11.0

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

## 0.9.0

## 0.8.0

## 0.7.0

### Patch Changes

- f59154fb: Fix issue where slash could not be used in token name

## 0.6.0

## 0.5.1

### Patch Changes

- c0335cf4: Fix the `astish` shared function when using `config.syntax: 'template-literal'`

  ex: css`${someVar}`

  if a value is unresolvable in the static analysis step, it would be interpreted as `undefined`, and `astish` would
  throw:

  > TypeError: Cannot read properties of undefined (reading 'replace')

- 762fd0c9: Fix issue where the `walkObject` shared helper would set an object key to a nullish value

  Example:

  ```ts
  const shorthands = {
    flexDir: 'flexDirection',
  }

  const obj = {
    flexDir: 'row',
    flexDirection: undefined,
  }

  const result = walkObject(obj, (value) => value, {
    getKey(prop) {
      return shorthands[prop] ?? prop
    },
  })
  ```

  This would set the `flexDirection` to `row` (using `getKey`) and then set the `flexDirection` property again, this
  time to `undefined`, since it existed in the original object

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

### Patch Changes

- 60df9bd1: Fix issue where escaping classname doesn't work when class starts with number.

## 0.4.0

## 0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch

## 0.3.0

## 0.0.2

### Patch Changes

- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.
