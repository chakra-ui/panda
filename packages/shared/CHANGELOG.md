# @pandacss/shared

## 0.34.0

## 0.33.0

## 0.32.1

## 0.32.0

### Patch Changes

- 8cd8c19: Always sort `all` to be first, so that other properties can easily override it

## 0.31.0

### Minor Changes

- f0296249: - Sort the longhand/shorthand atomic rules in a deterministic order to prevent property conflicts

  - Automatically merge the `base` object in the `css` root styles in the runtime
  - This may be a breaking change depending on how your styles are created

  Ex:

  ```ts
  css({
    padding: "1px",
    paddingTop: "3px",
    paddingBottom: "4px",
  });
  ```

  Will now always generate the following css:

  ```css
  @layer utilities {
    .p_1px {
      padding: 1px;
    }

    .pt_3px {
      padding-top: 3px;
    }

    .pb_4px {
      padding-bottom: 4px;
    }
  }
  ```

## 0.30.2

## 0.30.1

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

## 0.29.0

## 0.28.0

### Patch Changes

- 770c7aa4: Update `getArbitraryValue` so it works for values that start on a new line

## 0.27.3

## 0.27.2

## 0.27.1

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

- 74ac0d9d: Improve the performance of the runtime transform functions by caching their results (css, cva, sva,
  recipe/slot recipe, patterns)

  > See detailed breakdown of the performance improvements
  > [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

## 0.26.2

## 0.26.1

## 0.26.0

### Patch Changes

- 657ca5da: Fix issue where `[]` escape hatch clashed with named grid lines

## 0.25.0

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value

## 0.24.1

## 0.24.0

## 0.23.0

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

## 0.22.0

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties

## 0.21.0

### Minor Changes

- 26e6051a: Add an escape-hatch for arbitrary values when using `config.strictTokens`, by prefixing the value with `[`
  and suffixing with `]`, e.g. writing `[123px]` as a value will bypass the token validation.

  ```ts
  import { css } from "../styled-system/css";

  css({
    // @ts-expect-error TS will throw when using from strictTokens: true
    color: "#fff",
    // @ts-expect-error TS will throw when using from strictTokens: true
    width: "100px",

    // ✅ but this is now allowed:
    bgColor: "[rgb(51 155 240)]",
    fontSize: "[12px]",
  });
  ```

## 0.20.1

## 0.20.0

## 0.19.0

## 0.18.3

## 0.18.2

## 0.18.1

## 0.18.0

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline

## 0.17.5

## 0.17.4

## 0.17.3

## 0.17.2

## 0.17.1

### Patch Changes

- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM

## 0.17.0

### Minor Changes

- 12281ff8: Improve support for styled element composition. This ensures that you can compose two styled elements
  together and the styles will be merged correctly.

  ```jsx
  const Box = styled("div", {
    base: {
      background: "red.light",
      color: "white",
    },
  });

  const ExtendedBox = styled(Box, {
    base: { background: "red.dark" },
  });

  // <ExtendedBox> will have a background of `red.dark` and a color of `white`
  ```

  **Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when
  an element is created from a cva/inline cva, and another created from a config recipe.

  - CVA or Inline CVA + CVA or Inline CVA = ✅
  - Config Recipe + Config Recipe = ✅
  - CVA or Inline CVA + Config Recipe = ❌

  ```jsx
  import { button } from "../styled-system/recipes";

  const Button = styled("div", button);

  // ❌ This will throw an error
  const ExtendedButton = styled(Button, {
    base: { background: "red.dark" },
  });
  ```

## 0.16.0

## 0.15.5

## 0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work

## 0.15.2

## 0.15.1

### Patch Changes

- 26f6982c: Fix issue where slot recipe breaks when `slots` is `undefined`

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

## 0.14.0

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
  <h1
    className={cx(
      css({ mx: "3", paddingTop: "4" }),
      css({ mx: "10", pt: "6" }),
    )}
  >
    Will result in "mx_10 pt_6"
  </h1>
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
  import { sva } from "styled-system/css";

  const button = sva({
    slots: ["label", "icon"],
    base: {
      label: { color: "red", textDecoration: "underline" },
    },
    variants: {
      rounded: {
        true: {},
      },
      size: {
        sm: {
          label: { fontSize: "sm" },
          icon: { fontSize: "sm" },
        },
        lg: {
          label: { fontSize: "lg" },
          icon: { fontSize: "lg", color: "pink" },
        },
      },
    },
    defaultVariants: {
      size: "sm",
    },
  });
  ```

  **Usage**

  ```jsx
  export function App() {
    const btnClass = button({ size: "lg", rounded: true });

    return (
      <button>
        <p class={btnClass.label}> Label</p>
        <p class={btnClass.icon}> Icon</p>
      </button>
    );
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
    flexDir: "flexDirection",
  };

  const obj = {
    flexDir: "row",
    flexDirection: undefined,
  };

  const result = walkObject(obj, (value) => value, {
    getKey(prop) {
      return shorthands[prop] ?? prop;
    },
  });
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
    syntax: "template-literal",
  });
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

- 49c760cd: Fix issue where responsive array in css and cva doesn't generate the correct classname

## 0.29.1

## 0.29.0

## 0.28.0

### Patch Changes

- 770c7aa4: Update `getArbitraryValue` so it works for values that start on a new line

## 0.27.3

## 0.27.2

## 0.27.1

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

- 74ac0d9d: Improve the performance of the runtime transform functions by caching their results (css, cva, sva,
  recipe/slot recipe, patterns)

  > See detailed breakdown of the performance improvements
  > [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

## 0.26.2

## 0.26.1

## 0.26.0

### Patch Changes

- 657ca5da: Fix issue where `[]` escape hatch clashed with named grid lines

## 0.25.0

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value

## 0.24.1

## 0.24.0

## 0.23.0

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

## 0.22.0

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties

## 0.21.0

### Minor Changes

- 26e6051a: Add an escape-hatch for arbitrary values when using `config.strictTokens`, by prefixing the value with `[`
  and suffixing with `]`, e.g. writing `[123px]` as a value will bypass the token validation.

  ```ts
  import { css } from "../styled-system/css";

  css({
    // @ts-expect-error TS will throw when using from strictTokens: true
    color: "#fff",
    // @ts-expect-error TS will throw when using from strictTokens: true
    width: "100px",

    // ✅ but this is now allowed:
    bgColor: "[rgb(51 155 240)]",
    fontSize: "[12px]",
  });
  ```

## 0.20.1

## 0.20.0

## 0.19.0

## 0.18.3

## 0.18.2

## 0.18.1

## 0.18.0

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline

## 0.17.5

## 0.17.4

## 0.17.3

## 0.17.2

## 0.17.1

### Patch Changes

- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM

## 0.17.0

### Minor Changes

- 12281ff8: Improve support for styled element composition. This ensures that you can compose two styled elements
  together and the styles will be merged correctly.

  ```jsx
  const Box = styled("div", {
    base: {
      background: "red.light",
      color: "white",
    },
  });

  const ExtendedBox = styled(Box, {
    base: { background: "red.dark" },
  });

  // <ExtendedBox> will have a background of `red.dark` and a color of `white`
  ```

  **Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when
  an element is created from a cva/inline cva, and another created from a config recipe.

  - CVA or Inline CVA + CVA or Inline CVA = ✅
  - Config Recipe + Config Recipe = ✅
  - CVA or Inline CVA + Config Recipe = ❌

  ```jsx
  import { button } from "../styled-system/recipes";

  const Button = styled("div", button);

  // ❌ This will throw an error
  const ExtendedButton = styled(Button, {
    base: { background: "red.dark" },
  });
  ```

## 0.16.0

## 0.15.5

## 0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work

## 0.15.2

## 0.15.1

### Patch Changes

- 26f6982c: Fix issue where slot recipe breaks when `slots` is `undefined`

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

## 0.14.0

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
  <h1
    className={cx(
      css({ mx: "3", paddingTop: "4" }),
      css({ mx: "10", pt: "6" }),
    )}
  >
    Will result in "mx_10 pt_6"
  </h1>
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
  import { sva } from "styled-system/css";

  const button = sva({
    slots: ["label", "icon"],
    base: {
      label: { color: "red", textDecoration: "underline" },
    },
    variants: {
      rounded: {
        true: {},
      },
      size: {
        sm: {
          label: { fontSize: "sm" },
          icon: { fontSize: "sm" },
        },
        lg: {
          label: { fontSize: "lg" },
          icon: { fontSize: "lg", color: "pink" },
        },
      },
    },
    defaultVariants: {
      size: "sm",
    },
  });
  ```

  **Usage**

  ```jsx
  export function App() {
    const btnClass = button({ size: "lg", rounded: true });

    return (
      <button>
        <p class={btnClass.label}> Label</p>
        <p class={btnClass.icon}> Icon</p>
      </button>
    );
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
    flexDir: "flexDirection",
  };

  const obj = {
    flexDir: "row",
    flexDirection: undefined,
  };

  const result = walkObject(obj, (value) => value, {
    getKey(prop) {
      return shorthands[prop] ?? prop;
    },
  });
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
    syntax: "template-literal",
  });
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
