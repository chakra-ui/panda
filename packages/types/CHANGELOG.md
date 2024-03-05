# @pandacss/types

## 0.34.0

### Minor Changes

- d1516c8: Deprecates `emitPackage`, it will be removed in the next major version.

  ## Why?

  It's known for causing several issues:

  - bundlers sometimes eagerly cache the `node_modules`, leading to `panda codegen` updates to the `styled-system` not
    visible in the browser
  - auto-imports are not suggested in your IDE.
  - in some IDE the typings are not always reflected properly

  ## As alternatives, you can use:

  - relative paths instead of absolute paths (e.g. `../styled-system/css` instead of `styled-system/css`)
  - use [package.json #imports](https://nodejs.org/api/packages.html#subpath-imports) and/or tsconfig path aliases (prefer
    package.json#imports when possible, TS 5.4 supports them by default) like `#styled-system/css` instead of
    `styled-system/css`
  - for a [component library](https://panda-css.com/docs/guides/component-library), use a dedicated workspace package
    (e.g. `@acme/styled-system`) and use `importMap: "@acme/styled-system"` so that Panda knows which entrypoint to
    extract, e.g. `import { css } from '@acme/styled-system/css'`

## 0.33.0

### Minor Changes

- fde37d8: Add support for element level css reset via `preflight.level`. Learn more
  [here](https://github.com/chakra-ui/panda/discussions/1992).

  Setting `preflight.level` to `'element'` applies the reset directly to the individual elements that have the scope
  class assigned.

  ```js
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    preflight: {
      scope: ".my-scope",
      level: "element", // 'element' | 'parent (default)'
    },
    // ...
  });
  ```

  This will generate CSS that looks like:

  ```css
  button.my-scope {
  }

  img.my-scope {
  }
  ```

  This approach allows for more flexibility, enabling selective application of CSS resets either to an entire parent
  container or to specific elements within a container.

### Patch Changes

- cca50d5: Add a `group` to every utility in the `@pandacss/preset-base`, this helps Panda tooling organize utilities.

## 0.32.1

### Patch Changes

- a032375: Add a way to create config conditions with nested at-rules/selectors

  ```ts
  export default defaultConfig({
    conditions: {
      extend: {
        supportHover: ["@media (hover: hover) and (pointer: fine)", "&:hover"],
      },
    },
  });
  ```

  ```ts
  import { css } from "../styled-system/css";

  css({
    _supportHover: {
      color: "red",
    },
  });
  ```

  will generate the following CSS:

  ```css
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: red;
    }
  }
  ```

- 89ffb6b: Add missing config dependencies for some `styled-system/types` files

## 0.32.0

### Minor Changes

- de4d9ef: Allow `config.hooks` to be shared in `plugins`

  For hooks that can transform Panda's internal state by returning something (like `cssgen:done` and `codegen:prepare`),
  each hook instance will be called sequentially and the return result (if any) of the previous hook call is passed to
  the next hook so that they can be chained together.

### Patch Changes

- 60cace3: This change allows the user to set `jsxFramework` to any string to enable extracting JSX components.

  ***

  Context: In a previous version, Panda's extractor used to always extract JSX style props even when not specifying a
  `jsxFramework`. This was considered a bug and has been fixed, which reduced the amount of work panda does and
  artifacts generated if the user doesn't need jsx.

  Now, in some cases like when using Svelte or Astro, the user might still to use & extract JSX style props, but the
  `jsxFramework` didn't have a way to specify that. This change allows the user to set `jsxFramework` to any string to
  enable extracting JSX components without generating any artifacts.

## 0.31.0

### Minor Changes

- a17fe387: - Add a `config.polyfill` option that will polyfill the CSS @layer at-rules using a
  [postcss plugin](https://www.npmjs.com/package/@csstools/postcss-cascade-layers)
  - And `--polyfill` flag to `panda` and `panda cssgen` commands

### Patch Changes

- 8f36f9af: Add a `RecipeVariant` type to get the variants in a strict object from `cva` function. This complements the
  `RecipeVariantprops` type that extracts the variant as optional props, mostly intended for JSX components.
- 2d69b340: Fix `styled` factory nested composition with `cva`

## 0.30.2

### Patch Changes

- 6b829cab: Allow configuring the `matchTag` / `matchTagProp` functions to customize the way Panda extracts your JSX.
  This can be especially useful when working with libraries that have properties that look like CSS properties but are
  not and should be ignored.

  > **Note**: This feature mostly affects users who have `jsxStyleProps` set to `all`. This is currently the default.
  >
  > Setting it to `minimal` (which also allows passing the css prop) or `none` (which disables the extraction of CSS
  > properties) will make this feature less useful.

  Here's an example with Radix UI where the `Select.Content` component has a `position` property that should be ignored:

  ```tsx
  // Here, the `position` property will be extracted because `position` is a valid CSS property
  <Select.Content position="popper" sideOffset={5}>
  ```

  ```tsx
  export default defineConfig({
    // ...
    hooks: {
      "parser:before": ({ configure }) => {
        configure({
          // ignore the Select.Content entirely
          matchTag: (tag) => tag !== "Select.Content",
          // ...or specifically ignore the `position` property
          matchTagProp: (tag, prop) =>
            tag === "Select.Content" && prop !== "position",
        });
      },
    },
  });
  ```

## 0.30.1

## 0.30.0

### Patch Changes

- 74485ef1: Add `utils` functions in the `config:resolved` hook, making it easy to apply transformations after all
  presets have been merged.

  For example, this could be used if you want to use most of a preset but want to completely omit a few things, while
  keeping the rest. Let's say we want to remove the `stack` pattern from the built-in `@pandacss/preset-base`:

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    hooks: {
      "config:resolved": ({ config, utils }) => {
        return utils.omit(config, ["patterns.stack"]);
      },
    },
  });
  ```

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

- a2fb5cc6: - Add support for explicitly specifying config related files that should trigger a context reload on change.

  > We automatically track the config file and (transitive) files imported by the config file as much as possible, but
  > sometimes we might miss some. You can use this option as a workaround for those edge cases.

  Set the `dependencies` option in `panda.config.ts` to a glob or list of files.

  ```ts
  export default defineConfig({
    // ...
    dependencies: ["path/to/files/**.ts"],
  });
  ```

  - Invoke `config:change` hook in more situations (when the `--watch` flag is passed to `panda codegen`,
    `panda cssgen`, `panda ship`)

  - Watch for more config options paths changes, so that the related artifacts will be regenerated a bit more reliably
    (ex: updating the `config.hooks` will now trigger a full regeneration of `styled-system`)

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

### Patch Changes

- 1ed4df77: Fix issue where HMR doesn't work when tsconfig paths is used.

## 0.27.2

## 0.27.1

### Patch Changes

- ee9341db: Fix issue in windows environments where HMR doesn't work in webpack projects.

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

### Patch Changes

- b5cf6ee6: Add `borderWidths` token to types
- 58df7d74: Remove eject type from presets

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value

## 0.24.1

## 0.24.0

### Patch Changes

- f6881022: Add `patterns` to `config.staticCss`

  ***

  Fix the special `[*]` rule which used to generate the same rule for every breakpoints, which is not what most people
  need (it's still possible by explicitly using `responsive: true`).

  ```ts
  const card = defineRecipe({
    className: "card",
    base: { color: "white" },
    variants: {
      size: {
        small: { fontSize: "14px" },
        large: { fontSize: "18px" },
      },
      visual: {
        primary: { backgroundColor: "blue" },
        secondary: { backgroundColor: "gray" },
      },
    },
  });

  export default defineConfig({
    // ...
    staticCss: {
      recipes: {
        card: ["*"], // this

        // was equivalent to:
        card: [
          // notice how `responsive: true` was implicitly added
          { size: ["*"], responsive: true },
          { visual: ["*"], responsive: true },
        ],

        //   will now correctly be equivalent to:
        card: [{ size: ["*"] }, { visual: ["*"] }],
      },
    },
  });
  ```

  Here's the diff in the generated CSS:

  ```diff
  @layer recipes {
    .card--size_small {
      font-size: 14px;
    }

    .card--size_large {
      font-size: 18px;
    }

    .card--visual_primary {
      background-color: blue;
    }

    .card--visual_secondary {
      background-color: gray;
    }

    @layer _base {
      .card {
        color: var(--colors-white);
      }
    }

  -  @media screen and (min-width: 40em) {
  -    -.sm\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.sm\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.sm\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.sm\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 48em) {
  -    -.md\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.md\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.md\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.md\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 64em) {
  -    -.lg\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.lg\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.lg\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.lg\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 80em) {
  -    -.xl\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.xl\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.xl\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.xl\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 96em) {
  -    -.\32xl\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.\32xl\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.\32xl\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.\32xl\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }
  }
  ```

## 0.23.0

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
  import { defineRecipe } from "@pandacss/dev";

  const card = defineRecipe({
    className: "card",
    base: { color: "white" },
    variants: {
      size: {
        small: { fontSize: "14px" },
        large: { fontSize: "18px" },
      },
    },
    staticCss: [{ size: ["*"] }],
  });
  ```

  would be the equivalent of defining it inside the main config:

  ```js
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    staticCss: {
      recipes: {
        card: {
          size: ["*"],
        },
      },
    },
  });
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
        button: ["*"],
      },
    },
  });

  export default defineConfig({
    presets: [presetWithStaticCss],
    staticCss: {
      extend: {
        recipes: {
          // extend and pre-generate all sizes for card
          card: [{ size: ["small", "medium", "large"] }],
        },
      },
    },
  });
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
    outdir: "./outdir",
    importMap: {
      css: "#panda/styled-system/css",
      recipes: "#panda/styled-system/recipes",
      patterns: "#panda/styled-system/patterns",
      jsx: "#panda/styled-system/jsx",
    },
  });
  ```

  Or you could also make your outdir an actual package from your monorepo:

  ```ts
  export default defineConfig({
    outdir: "../packages/styled-system",
    importMap: {
      css: "@monorepo/styled-system",
      recipes: "@monorepo/styled-system",
      patterns: "@monorepo/styled-system",
      jsx: "@monorepo/styled-system",
    },
  });
  ```

  Working with tsconfig paths aliases is easy:

  ```ts
  export default defineConfig({
    outdir: "styled-system",
    importMap: {
      css: "styled-system/css",
      recipes: "styled-system/recipes",
      patterns: "styled-system/patterns",
      jsx: "styled-system/jsx",
    },
  });
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
      button: [{ size: ["*"], shape: ["*"] }];
    }
  }
  ```

  now:

  ```ts
  staticCss: {
    recipes: {
      button: ["*"];
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

## 0.4.0

### Minor Changes

- 5b344b9c: Add support for disabling shorthand props

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    shorthands: false,
  });
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

- a2fb5cc6: - Add support for explicitly specifying config related files that should trigger a context reload on change.

  > We automatically track the config file and (transitive) files imported by the config file as much as possible, but
  > sometimes we might miss some. You can use this option as a workaround for those edge cases.

  Set the `dependencies` option in `panda.config.ts` to a glob or list of files.

  ```ts
  export default defineConfig({
    // ...
    dependencies: ["path/to/files/**.ts"],
  });
  ```

  - Invoke `config:change` hook in more situations (when the `--watch` flag is passed to `panda codegen`,
    `panda cssgen`, `panda ship`)

  - Watch for more config options paths changes, so that the related artifacts will be regenerated a bit more reliably
    (ex: updating the `config.hooks` will now trigger a full regeneration of `styled-system`)

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

### Patch Changes

- 1ed4df77: Fix issue where HMR doesn't work when tsconfig paths is used.

## 0.27.2

## 0.27.1

### Patch Changes

- ee9341db: Fix issue in windows environments where HMR doesn't work in webpack projects.

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

### Patch Changes

- b5cf6ee6: Add `borderWidths` token to types
- 58df7d74: Remove eject type from presets

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value

## 0.24.1

## 0.24.0

### Patch Changes

- f6881022: Add `patterns` to `config.staticCss`

  ***

  Fix the special `[*]` rule which used to generate the same rule for every breakpoints, which is not what most people
  need (it's still possible by explicitly using `responsive: true`).

  ```ts
  const card = defineRecipe({
    className: "card",
    base: { color: "white" },
    variants: {
      size: {
        small: { fontSize: "14px" },
        large: { fontSize: "18px" },
      },
      visual: {
        primary: { backgroundColor: "blue" },
        secondary: { backgroundColor: "gray" },
      },
    },
  });

  export default defineConfig({
    // ...
    staticCss: {
      recipes: {
        card: ["*"], // this

        // was equivalent to:
        card: [
          // notice how `responsive: true` was implicitly added
          { size: ["*"], responsive: true },
          { visual: ["*"], responsive: true },
        ],

        //   will now correctly be equivalent to:
        card: [{ size: ["*"] }, { visual: ["*"] }],
      },
    },
  });
  ```

  Here's the diff in the generated CSS:

  ```diff
  @layer recipes {
    .card--size_small {
      font-size: 14px;
    }

    .card--size_large {
      font-size: 18px;
    }

    .card--visual_primary {
      background-color: blue;
    }

    .card--visual_secondary {
      background-color: gray;
    }

    @layer _base {
      .card {
        color: var(--colors-white);
      }
    }

  -  @media screen and (min-width: 40em) {
  -    -.sm\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.sm\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.sm\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.sm\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 48em) {
  -    -.md\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.md\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.md\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.md\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 64em) {
  -    -.lg\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.lg\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.lg\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.lg\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 80em) {
  -    -.xl\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.xl\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.xl\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.xl\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 96em) {
  -    -.\32xl\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.\32xl\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.\32xl\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.\32xl\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }
  }
  ```

## 0.23.0

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
  import { defineRecipe } from "@pandacss/dev";

  const card = defineRecipe({
    className: "card",
    base: { color: "white" },
    variants: {
      size: {
        small: { fontSize: "14px" },
        large: { fontSize: "18px" },
      },
    },
    staticCss: [{ size: ["*"] }],
  });
  ```

  would be the equivalent of defining it inside the main config:

  ```js
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    staticCss: {
      recipes: {
        card: {
          size: ["*"],
        },
      },
    },
  });
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
        button: ["*"],
      },
    },
  });

  export default defineConfig({
    presets: [presetWithStaticCss],
    staticCss: {
      extend: {
        recipes: {
          // extend and pre-generate all sizes for card
          card: [{ size: ["small", "medium", "large"] }],
        },
      },
    },
  });
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
    outdir: "./outdir",
    importMap: {
      css: "#panda/styled-system/css",
      recipes: "#panda/styled-system/recipes",
      patterns: "#panda/styled-system/patterns",
      jsx: "#panda/styled-system/jsx",
    },
  });
  ```

  Or you could also make your outdir an actual package from your monorepo:

  ```ts
  export default defineConfig({
    outdir: "../packages/styled-system",
    importMap: {
      css: "@monorepo/styled-system",
      recipes: "@monorepo/styled-system",
      patterns: "@monorepo/styled-system",
      jsx: "@monorepo/styled-system",
    },
  });
  ```

  Working with tsconfig paths aliases is easy:

  ```ts
  export default defineConfig({
    outdir: "styled-system",
    importMap: {
      css: "styled-system/css",
      recipes: "styled-system/recipes",
      patterns: "styled-system/patterns",
      jsx: "styled-system/jsx",
    },
  });
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
      button: [{ size: ["*"], shape: ["*"] }];
    }
  }
  ```

  now:

  ```ts
  staticCss: {
    recipes: {
      button: ["*"];
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

## 0.4.0

### Minor Changes

- 5b344b9c: Add support for disabling shorthand props

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    shorthands: false,
  });
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
