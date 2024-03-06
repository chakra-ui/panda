# @pandacss/fixture

## 0.34.0

## 0.33.0

## 0.32.1

## 0.32.0

## 0.31.0

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

## 0.28.0

### Minor Changes

- f58f6df2: Refactor `config.hooks` to be much more powerful, you can now:

  - Tweak the config after it has been resolved (after presets are loaded and merged), this could be used to dynamically
    load all `recipes` from a folder
  - Transform a source file's content before parsing it, this could be used to transform the file content to a
    `tsx`-friendly syntax so that Panda's parser can parse it.
  - Implement your own parser logic and add the extracted results to the classic Panda pipeline, this could be used to
    parse style usage from any template language
  - Tweak the CSS content for any `@layer` or even right before it's written to disk (if using the CLI) or injected
    through the postcss plugin, allowing all kinds of customizations like removing the unused CSS variables, etc.
  - React to any config change or after the codegen step (your outdir, the `styled-system` folder) have been generated

  See the list of available `config.hooks` here:

  ```ts
  export interface PandaHooks {
    /**
     * Called when the config is resolved, after all the presets are loaded and merged.
     * This is the first hook called, you can use it to tweak the config before the context is created.
     */
    "config:resolved": (args: { conf: LoadConfigResult }) => MaybeAsyncReturn;
    /**
     * Called when the Panda context has been created and the API is ready to be used.
     */
    "context:created": (args: {
      ctx: ApiInterface;
      logger: LoggerInterface;
    }) => void;
    /**
     * Called when the config file or one of its dependencies (imports) has changed.
     */
    "config:change": (args: { config: UserConfig }) => MaybeAsyncReturn;
    /**
     * Called after reading the file content but before parsing it.
     * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
     * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
     */
    "parser:before": (args: {
      filePath: string;
      content: string;
    }) => string | void;
    /**
     * Called after the file styles are extracted and processed into the resulting ParserResult object.
     * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
     */
    "parser:after": (args: {
      filePath: string;
      result: ParserResultInterface | undefined;
    }) => void;
    /**
     * Called after the codegen is completed
     */
    "codegen:done": () => MaybeAsyncReturn;
    /**
     * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
     * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
     * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
     */
    "cssgen:done": (args: {
      artifact:
        | "global"
        | "static"
        | "reset"
        | "tokens"
        | "keyframes"
        | "styles.css";
      content: string;
    }) => string | void;
  }
  ```

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

## 0.26.2

## 0.26.1

## 0.26.0

## 0.25.0

## 0.24.2

## 0.24.1

## 0.24.0

## 0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
  - @pandacss/types@0.22.1
  - @pandacss/preset-base@0.22.1
  - @pandacss/preset-panda@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [1cc8fcff]
  - @pandacss/types@0.22.0
  - @pandacss/preset-base@0.22.0
  - @pandacss/preset-panda@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/types@0.21.0
  - @pandacss/preset-base@0.21.0
  - @pandacss/preset-panda@0.21.0

## 0.20.1

### Patch Changes

- Updated dependencies [428e5401]
  - @pandacss/preset-base@0.20.1
  - @pandacss/preset-panda@0.20.1
  - @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/preset-base@0.20.0
  - @pandacss/preset-panda@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/preset-base@0.19.0
  - @pandacss/preset-panda@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/preset-base@0.18.3
- @pandacss/preset-panda@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies [3e1ea626]
  - @pandacss/preset-base@0.18.2
  - @pandacss/preset-panda@0.18.2
  - @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [ce34ea45]
- Updated dependencies [aac7b379]
  - @pandacss/preset-base@0.18.1
  - @pandacss/preset-panda@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- @pandacss/types@0.18.0
- @pandacss/preset-base@0.18.0
- @pandacss/preset-panda@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/preset-base@0.17.5
- @pandacss/preset-panda@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/preset-base@0.17.4
  - @pandacss/preset-panda@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/preset-base@0.17.3
  - @pandacss/preset-panda@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/preset-base@0.17.2
- @pandacss/preset-panda@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- @pandacss/types@0.17.1
- @pandacss/preset-base@0.17.1
- @pandacss/preset-panda@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [fc4688e6]
  - @pandacss/types@0.17.0
  - @pandacss/preset-base@0.17.0
  - @pandacss/preset-panda@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [0f3bede5]
  - @pandacss/preset-base@0.16.0
  - @pandacss/preset-panda@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/preset-base@0.15.5
- @pandacss/preset-panda@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/preset-base@0.15.4
- @pandacss/preset-panda@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/types@0.15.3
  - @pandacss/preset-base@0.15.3
  - @pandacss/preset-panda@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/preset-base@0.15.2
  - @pandacss/preset-panda@0.15.2

## 0.15.1

### Patch Changes

- @pandacss/types@0.15.1
- @pandacss/preset-base@0.15.1
- @pandacss/preset-panda@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [39298609]
  - @pandacss/types@0.15.0
  - @pandacss/preset-base@0.15.0
  - @pandacss/preset-panda@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/preset-base@0.14.0
  - @pandacss/preset-panda@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/preset-base@0.13.1
- @pandacss/preset-panda@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/preset-base@0.13.0
- @pandacss/preset-panda@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/preset-base@0.12.2
- @pandacss/preset-panda@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/preset-base@0.12.1
- @pandacss/preset-panda@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [bf2ff391]
  - @pandacss/preset-base@0.12.0
  - @pandacss/preset-panda@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/types@0.11.1
  - @pandacss/preset-base@0.11.1
  - @pandacss/preset-panda@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
- Updated dependencies [811f4fb1]
  - @pandacss/types@0.11.0
  - @pandacss/preset-base@0.11.0
  - @pandacss/preset-panda@0.11.0

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

- Updated dependencies [24e783b3]
- Updated dependencies [00d11a8b]
- Updated dependencies [1972b4fa]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/types@0.10.0
  - @pandacss/preset-base@0.10.0
  - @pandacss/preset-panda@0.10.0

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
  - @pandacss/preset-base@0.9.0
  - @pandacss/types@0.9.0
  - @pandacss/preset-panda@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [be0ad578]
  - @pandacss/preset-base@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/preset-panda@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [60a77841]
- Updated dependencies [a9c189b7]
- Updated dependencies [d9eeba60]
  - @pandacss/preset-base@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/preset-panda@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [97fbe63f]
- Updated dependencies [08d33e0f]
- Updated dependencies [f7aff8eb]
  - @pandacss/preset-base@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/preset-panda@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/preset-base@0.5.1
  - @pandacss/preset-panda@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [ead9eaa3]
- Updated dependencies [3a87cff8]
  - @pandacss/types@0.5.0
  - @pandacss/preset-panda@0.5.0
  - @pandacss/preset-base@0.5.0

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

## 0.3.2

### Patch Changes

- @pandacss/preset-base@0.3.2
- @pandacss/preset-panda@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
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

## 0.29.1

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

## 0.28.0

### Minor Changes

- f58f6df2: Refactor `config.hooks` to be much more powerful, you can now:

  - Tweak the config after it has been resolved (after presets are loaded and merged), this could be used to dynamically
    load all `recipes` from a folder
  - Transform a source file's content before parsing it, this could be used to transform the file content to a
    `tsx`-friendly syntax so that Panda's parser can parse it.
  - Implement your own parser logic and add the extracted results to the classic Panda pipeline, this could be used to
    parse style usage from any template language
  - Tweak the CSS content for any `@layer` or even right before it's written to disk (if using the CLI) or injected
    through the postcss plugin, allowing all kinds of customizations like removing the unused CSS variables, etc.
  - React to any config change or after the codegen step (your outdir, the `styled-system` folder) have been generated

  See the list of available `config.hooks` here:

  ```ts
  export interface PandaHooks {
    /**
     * Called when the config is resolved, after all the presets are loaded and merged.
     * This is the first hook called, you can use it to tweak the config before the context is created.
     */
    "config:resolved": (args: { conf: LoadConfigResult }) => MaybeAsyncReturn;
    /**
     * Called when the Panda context has been created and the API is ready to be used.
     */
    "context:created": (args: {
      ctx: ApiInterface;
      logger: LoggerInterface;
    }) => void;
    /**
     * Called when the config file or one of its dependencies (imports) has changed.
     */
    "config:change": (args: { config: UserConfig }) => MaybeAsyncReturn;
    /**
     * Called after reading the file content but before parsing it.
     * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
     * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
     */
    "parser:before": (args: {
      filePath: string;
      content: string;
    }) => string | void;
    /**
     * Called after the file styles are extracted and processed into the resulting ParserResult object.
     * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
     */
    "parser:after": (args: {
      filePath: string;
      result: ParserResultInterface | undefined;
    }) => void;
    /**
     * Called after the codegen is completed
     */
    "codegen:done": () => MaybeAsyncReturn;
    /**
     * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
     * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
     * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
     */
    "cssgen:done": (args: {
      artifact:
        | "global"
        | "static"
        | "reset"
        | "tokens"
        | "keyframes"
        | "styles.css";
      content: string;
    }) => string | void;
  }
  ```

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

## 0.26.2

## 0.26.1

## 0.26.0

## 0.25.0

## 0.24.2

## 0.24.1

## 0.24.0

## 0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
  - @pandacss/types@0.22.1
  - @pandacss/preset-base@0.22.1
  - @pandacss/preset-panda@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [1cc8fcff]
  - @pandacss/types@0.22.0
  - @pandacss/preset-base@0.22.0
  - @pandacss/preset-panda@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/types@0.21.0
  - @pandacss/preset-base@0.21.0
  - @pandacss/preset-panda@0.21.0

## 0.20.1

### Patch Changes

- Updated dependencies [428e5401]
  - @pandacss/preset-base@0.20.1
  - @pandacss/preset-panda@0.20.1
  - @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/preset-base@0.20.0
  - @pandacss/preset-panda@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/preset-base@0.19.0
  - @pandacss/preset-panda@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/preset-base@0.18.3
- @pandacss/preset-panda@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies [3e1ea626]
  - @pandacss/preset-base@0.18.2
  - @pandacss/preset-panda@0.18.2
  - @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [ce34ea45]
- Updated dependencies [aac7b379]
  - @pandacss/preset-base@0.18.1
  - @pandacss/preset-panda@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- @pandacss/types@0.18.0
- @pandacss/preset-base@0.18.0
- @pandacss/preset-panda@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/preset-base@0.17.5
- @pandacss/preset-panda@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/preset-base@0.17.4
  - @pandacss/preset-panda@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/preset-base@0.17.3
  - @pandacss/preset-panda@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/preset-base@0.17.2
- @pandacss/preset-panda@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- @pandacss/types@0.17.1
- @pandacss/preset-base@0.17.1
- @pandacss/preset-panda@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [fc4688e6]
  - @pandacss/types@0.17.0
  - @pandacss/preset-base@0.17.0
  - @pandacss/preset-panda@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [0f3bede5]
  - @pandacss/preset-base@0.16.0
  - @pandacss/preset-panda@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/preset-base@0.15.5
- @pandacss/preset-panda@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/preset-base@0.15.4
- @pandacss/preset-panda@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/types@0.15.3
  - @pandacss/preset-base@0.15.3
  - @pandacss/preset-panda@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/preset-base@0.15.2
  - @pandacss/preset-panda@0.15.2

## 0.15.1

### Patch Changes

- @pandacss/types@0.15.1
- @pandacss/preset-base@0.15.1
- @pandacss/preset-panda@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [39298609]
  - @pandacss/types@0.15.0
  - @pandacss/preset-base@0.15.0
  - @pandacss/preset-panda@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/preset-base@0.14.0
  - @pandacss/preset-panda@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/preset-base@0.13.1
- @pandacss/preset-panda@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/preset-base@0.13.0
- @pandacss/preset-panda@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/preset-base@0.12.2
- @pandacss/preset-panda@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/preset-base@0.12.1
- @pandacss/preset-panda@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [bf2ff391]
  - @pandacss/preset-base@0.12.0
  - @pandacss/preset-panda@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/types@0.11.1
  - @pandacss/preset-base@0.11.1
  - @pandacss/preset-panda@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
- Updated dependencies [811f4fb1]
  - @pandacss/types@0.11.0
  - @pandacss/preset-base@0.11.0
  - @pandacss/preset-panda@0.11.0

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

- Updated dependencies [24e783b3]
- Updated dependencies [00d11a8b]
- Updated dependencies [1972b4fa]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/types@0.10.0
  - @pandacss/preset-base@0.10.0
  - @pandacss/preset-panda@0.10.0

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
  - @pandacss/preset-base@0.9.0
  - @pandacss/types@0.9.0
  - @pandacss/preset-panda@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [be0ad578]
  - @pandacss/preset-base@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/preset-panda@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [60a77841]
- Updated dependencies [a9c189b7]
- Updated dependencies [d9eeba60]
  - @pandacss/preset-base@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/preset-panda@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [97fbe63f]
- Updated dependencies [08d33e0f]
- Updated dependencies [f7aff8eb]
  - @pandacss/preset-base@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/preset-panda@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/preset-base@0.5.1
  - @pandacss/preset-panda@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [ead9eaa3]
- Updated dependencies [3a87cff8]
  - @pandacss/types@0.5.0
  - @pandacss/preset-panda@0.5.0
  - @pandacss/preset-base@0.5.0

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

## 0.3.2

### Patch Changes

- @pandacss/preset-base@0.3.2
- @pandacss/preset-panda@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
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
