# @pandacss/preset-base

## 0.34.0

### Patch Changes

- Updated dependencies [d1516c8]
  - @pandacss/types@0.34.0

## 0.33.0

### Patch Changes

- cca50d5: Add a `group` to every utility in the `@pandacss/preset-base`, this helps Panda tooling organize utilities.
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/types@0.33.0

## 0.32.1

### Patch Changes

- Updated dependencies [a032375]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/types@0.32.0

## 0.31.0

### Minor Changes

- 40cb30b9: Add `textShadowColor` utility

  ```ts
  css({
    textShadow: "1px 1px 1px var(--text-shadow-color)",
    textShadowColor: "black",
  });
  ```

### Patch Changes

- Updated dependencies [8f36f9af]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/types@0.30.1

## 0.30.0

### Patch Changes

- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [d5977c24]
  - @pandacss/types@0.30.0

## 0.29.1

### Patch Changes

- @pandacss/types@0.29.1

## 0.29.0

### Minor Changes

- 5fcdeb75: Update every utilities connected to the `colors` tokens in the `@pandacss/preset-base` (included by default)
  to use the [`color-mix`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) CSS function.

  This function allows you to mix two colors together, and we use it to change the opacity of a color using the
  `{color}/{opacity}` syntax.

  You can use it like this:

  ```ts
  css({
    bg: "red.300/40",
    color: "white",
  });
  ```

  This will generate:

  ```css
  @layer utilities {
    .bg_red\.300\/40 {
      --mix-background: color-mix(
        in srgb,
        var(--colors-red-300) 40%,
        transparent
      );
      background: var(--mix-background, var(--colors-red-300));
    }

    .text_white {
      color: var(--colors-white);
    }
  }
  ```

  - If you're not using any opacity, the utility will not use `color-mix`
  - The utility will automatically fallback to the original color if the `color-mix` function is not supported by the
    browser.
  - You can use any of the color tokens, and any of the opacity tokens.

  ***

  The `utilities` transform function also receives a new `utils` object that contains the `colorMix` function, so you
  can also use it on your own utilities:

  ```ts
  export default defineConfig({
    utilities: {
      background: {
        shorthand: "bg",
        className: "bg",
        values: "colors",
        transform(value, args) {
          const mix = args.utils.colorMix(value);
          // This can happen if the value format is invalid (e.g. `bg: red.300/invalid` or `bg: red.300//10`)
          if (mix.invalid) return { background: value };

          return {
            background: mix.value,
          };
        },
      },
    },
  });
  ```

  ***

  Here's a cool snippet (that we use internally !) that makes it easier to create a utility transform for a given
  property:

  ```ts
  import type { PropertyTransform } from "@pandacss/types";

  export const createColorMixTransform =
    (prop: string): PropertyTransform =>
    (value, args) => {
      const mix = args.utils.colorMix(value);
      if (mix.invalid) return { [prop]: value };

      const cssVar = "--mix-" + prop;

      return {
        [cssVar]: mix.value,
        [prop]: `var(${cssVar}, ${mix.color})`,
      };
    };
  ```

  then the same utility transform as above can be written like this:

  ```ts
  export default defineConfig({
    utilities: {
      background: {
        shorthand: "bg",
        className: "bg",
        values: "colors",
        transform: createColorMixTransform("background"),
    },
  });
  ```

- 250b4d11: ### Container Query Theme

  Improve support for CSS container queries by adding a new `containerNames` and `containerSizes` theme options.

  You can new define container names and sizes in your theme configuration and use them in your styles.

  ```ts
  export default defineConfig({
    // ...
    theme: {
      extend: {
        containerNames: ["sidebar", "content"],
        containerSizes: {
          xs: "40em",
          sm: "60em",
          md: "80em",
        },
      },
    },
  });
  ```

  The default container sizes in the `@pandacss/preset-panda` preset are shown below:

  ```ts
  export const containerSizes = {
    xs: "320px",
    sm: "384px",
    md: "448px",
    lg: "512px",
    xl: "576px",
    "2xl": "672px",
    "3xl": "768px",
    "4xl": "896px",
    "5xl": "1024px",
    "6xl": "1152px",
    "7xl": "1280px",
    "8xl": "1440px",
  };
  ```

  Then use them in your styles by referencing using `@<container-name>/<container-size>` syntax:

  > The default container syntax is `@/<container-size>`.

  ```ts
  import { css } from '/styled-system/css'

  function Demo() {
    return (
      <nav className={css({ containerType: 'inline-size' })}>
        <div
          className={css({
            fontSize: { '@/sm': 'md' },
          })}
        />
      </nav>
    )
  }
  ```

  This will generate the following CSS:

  ```css
  .cq-type_inline-size {
    container-type: inline-size;
  }

  @container (min-width: 60em) {
    .\@\/sm:fs_md {
      container-type: inline-size;
    }
  }
  ```

  ### Container Query Pattern

  To make it easier to use container queries, we've added a new `cq` pattern to `@pandacss/preset-base`.

  ```ts
  import { cq } from 'styled-system/patterns'

  function Demo() {
    return (
      <nav className={cq()}>
        <div
          className={css({
            fontSize: { base: 'lg', '@/sm': 'md' },
          })}
        />
      </nav>
    )
  }
  ```

  You can also named container queries:

  ```ts
  import { cq } from 'styled-system/patterns'

  function Demo() {
    return (
      <nav className={cq({ name: 'sidebar' })}>
        <div
          className={css({
            fontSize: { base: 'lg', '@sidebar/sm': 'md' },
          })}
        />
      </nav>
    )
  }
  ```

- f778d3e5: Updated the default preset in Panda to use the new `defaultValues` feature.

  To override the default values, consider using the `extend` pattern.

  ```js
  defineConfig({
    patterns: {
      extend: {
        stack: {
          defaultValues: { gap: "20px" },
        },
      },
    },
  });
  ```

### Patch Changes

- Updated dependencies [5fcdeb75]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f58f6df2]
  - @pandacss/types@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1

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

- bee3ec85: Add support for aspect ratio tokens in the panda config or preset. Aspect ratio tokens are used to define
  the aspect ratio of an element.

  ```js
  export default defineConfig({
    // ...
    theme: {
      extend: {
        // add aspect ratio tokens
        tokens: {
          aspectRatios: {
            "1:1": "1",
            "16:9": "16/9",
          },
        },
      },
    },
  });
  ```

  Here's what the default aspect ratio tokens in the base preset looks like:

  ```json
  {
    "square": { "value": "1 / 1" },
    "landscape": { "value": "4 / 3" },
    "portrait": { "value": "3 / 4" },
    "wide": { "value": "16 / 9" },
    "ultrawide": { "value": "18 / 5" },
    "golden": { "value": "1.618 / 1" }
  }
  ```

  **Breaking Change**

  The built-in token values has been removed from the `aspectRatio` utility to the `@pandacss/preset-base` as a token.

  For most users, this change should be a drop-in replacement. However, if you used a custom preset in the config, you
  might need to update it to include the new aspect ratio tokens.

### Patch Changes

- Updated dependencies [84304901]
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- f823a8c5: Fix `placeholder` condition in `preset-base`
  - @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- 3f6b3662: Add `data-placeholder` and `data-placeholder-shown` conditions
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/types@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/types@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0

## 0.23.0

### Patch Changes

- @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
  - @pandacss/types@0.22.1

## 0.22.0

### Patch Changes

- 1cc8fcff: Fixes a missing bracket in \_indeterminate condition
- Updated dependencies [526c6e34]
  - @pandacss/types@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/types@0.21.0

## 0.20.1

### Patch Changes

- 428e5401: - Added `strokeWidth` to svg utilities.
  - Connected `outlineWidth` utility to `borderWidths` token.
  - Add `borderWidth`, `borderTopWidth`, `borderLeftWidth`, `borderRightWidth`, `borderBottomWidth` to border utilities.
  - @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- 3e1ea626: Fix regression in grid pattern where `columns` doesn't not work as expected.
  - @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- ce34ea45: Make `_required` target `[data-required]` and `[aria-required=true]` attributes
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

  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- @pandacss/types@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- @pandacss/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [fc4688e6]
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- 0f3bede5: Add closed condition `&:is([closed], [data-closed], [data-state="closed"])`
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/types@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2

## 0.15.1

### Patch Changes

- @pandacss/types@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [39298609]
  - @pandacss/types@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- bf2ff391: Add `animationName` utility
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/types@0.11.1

## 0.11.0

### Minor Changes

- 811f4fb1: Add new visually hidden and bleed patterns.

  ### Bleed

  Bleed is a layout pattern is used to negate the padding applied to a parent container. You can apply an `inline` or
  `block` bleed to a child element, setting its value to match the parent's padding.

  ```tsx
  import { css } from "../styled-system/css";
  import { bleed } from "../styled-system/patterns";

  export function Page() {
    return (
      <div class={css({ px: "6" })}>
        <div class={bleed({ inline: "6" })}>Welcome</div>
      </div>
    );
  }
  ```

  ### Visually Hidden

  Visually hidden is a layout pattern used to hide content visually, but still make it available to screen readers.

  ```tsx
  import { css } from "../styled-system/css";
  import { visuallyHidden } from "../styled-system/patterns";

  export function Checkbox() {
    return (
      <label>
        <input type="checkbox" class={visuallyHidden()}>
          I'm hidde
        </input>
        <span>Checkbox</span>
      </label>
    );
  }
  ```

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0

## 0.10.0

### Patch Changes

- 00d11a8b: Update conditions
- 1972b4fa: Add opacity utility to base preset
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/types@0.10.0

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
  import { Circle } from "styled-system/jsx";
  const CustomCircle = ({ children, ...props }) => {
    return <Circle {...props}>{children}</Circle>;
  };
  ```

  To track the `CustomCircle` component, you can now use the `jsx` property.

  ```js
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    patterns: {
      extend: {
        circle: {
          jsx: ["CustomCircle"],
        },
      },
    },
  });
  ```

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0

## 0.8.0

### Patch Changes

- be0ad578: Fix parser issue with TS path mappings
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0

## 0.7.0

### Minor Changes

- 60a77841: Refactor `transition` utility to improve DX of adding transition. Transitions will now add a default
  transition property, timing function and duration. This allows you to add transitions with a single property.

  ```jsx
  <div className={css({ transition: "background" })}>Content</div>
  ```

  This will generate the following css:

  ```css
  .transition_background {
    transition-property: background, background-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  ```

### Patch Changes

- d9eeba60: Fix issue where `zIndex` tokens are not connected to zIndex utility
- Updated dependencies [a9c189b7]
  - @pandacss/types@0.7.0

## 0.6.0

### Minor Changes

- 97fbe63f: Add negative fraction values to `translateX` and `translateY` utilities

### Patch Changes

- 08d33e0f: - Fix issue where `gridRows` has the wrong `className`

  - Fix issue where `gridItem` pattern did not use the `colStart` and `rowStart` values

- f7aff8eb: Fix issue where `_even` and `_odd` map to incorrect selectors
  - @pandacss/types@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [ead9eaa3]
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- e8024347: Fix issue here divider pattern generated incorrect css in horizontal orientation
- d00eb17c: Add `auto` value where neccessary to base utilities.
- 9156c1c6: Fix placeholder condition to map to `&::placeholder`
- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- 0f36ebad: Add polyfill for common properties to reduce the need for autoprefixer
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- bd5c049b: Initial release
- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
