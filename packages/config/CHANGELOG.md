# @pandacss/config

## 0.34.0

### Patch Changes

- 1c63216: Add a config validation check to prevent using spaces in token keys, show better error logs when there's a CSS parsing error
- 9f04427: Fix "missing token" warning when using DEFAULT in tokens path

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    validation: "error",
    theme: {
      semanticTokens: {
        colors: {
          primary: {
            DEFAULT: { value: "#ff3333" },
            lighter: { value: "#ff6666" },
          },
          background: { value: "{colors.primary}" }, // <-- ⚠️ wrong warning
          background2: { value: "{colors.primary.lighter}" }, // <-- no warning, correct
        },
      },
    },
  });
  ```

  ***

  Add a warning when using `value` twice

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    validation: "error",
    theme: {
      tokens: {
        colors: {
          primary: { value: "#ff3333" },
        },
      },
      semanticTokens: {
        colors: {
          primary: {
            value: { value: "{colors.primary}" }, // <-- ⚠️ new warning for this
          },
        },
      },
    },
  });
  ```

- Updated dependencies [d1516c8]
  - @pandacss/types@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/preset-base@0.34.0
  - @pandacss/preset-panda@0.34.0
  - @pandacss/shared@0.34.0

## 0.33.0

### Patch Changes

- 8feeb95: Add `definePlugin` config functions for type-safety around plugins, add missing `plugins` in config
  dependencies to trigger a config reload on `plugins` change
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/preset-base@0.33.0
  - @pandacss/types@0.33.0
  - @pandacss/logger@0.33.0
  - @pandacss/preset-panda@0.33.0
  - @pandacss/shared@0.33.0

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
- Updated dependencies [a032375]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/preset-base@0.32.1
  - @pandacss/preset-panda@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Minor Changes

- de4d9ef: Allow `config.hooks` to be shared in `plugins`

  For hooks that can transform Panda's internal state by returning something (like `cssgen:done` and `codegen:prepare`),
  each hook instance will be called sequentially and the return result (if any) of the previous hook call is passed to
  the next hook so that they can be chained together.

### Patch Changes

- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/logger@0.32.0
  - @pandacss/preset-base@0.32.0
  - @pandacss/preset-panda@0.32.0

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

### Patch Changes

- e2ad0eed: - Fix issue in token validation logic where token with additional properties like `description` is
  considered invalid.
  - When `validation` is set to `error`, show all config errors at once instead of stopping at the first error.
- 2d69b340: Fix `styled` factory nested composition with `cva`
- ddeda8ac: Add missing log with the `panda -w` CLI, expose `resolveConfig` from `@pandacss/config`
- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
- Updated dependencies [40cb30b9]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/preset-base@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/preset-panda@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/preset-base@0.30.2
  - @pandacss/preset-panda@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- ffe177fd: Fix the regression caused by the downstream bundle-n-require package, which tries to load custom conditions
  first. This led to a `could not resolve @pandacss/dev` error
  - @pandacss/logger@0.30.1
  - @pandacss/preset-base@0.30.1
  - @pandacss/preset-panda@0.30.1
  - @pandacss/shared@0.30.1
  - @pandacss/types@0.30.1

## 0.30.0

### Minor Changes

- 0dd45b6a: Fix issue where config changes could not be detected due to config bundling returning stale result
  sometimes.

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

- ab32d1d7: Fix issue where errors were thrown when semantic tokens are overriden in tokens.
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

- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [49c760cd]
- Updated dependencies [d5977c24]
  - @pandacss/types@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/preset-base@0.30.0
  - @pandacss/preset-panda@0.30.0

## 0.29.1

### Patch Changes

- @pandacss/logger@0.29.1
- @pandacss/preset-base@0.29.1
- @pandacss/preset-panda@0.29.1
- @pandacss/shared@0.29.1
- @pandacss/types@0.29.1

## 0.29.0

### Minor Changes

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

### Patch Changes

- ea3f5548: Add config validation:

  - Check for duplicate between token & semanticTokens names
  - Check for duplicate between recipes/patterns/slots names
  - Check for token / semanticTokens paths (must end/contain 'value')
  - Check for self/circular token references
  - Check for missing tokens references
  - Check for conditions selectors (must contain '&')
  - Check for breakpoints units (must be the same)

  > You can set `validate: 'warn'` in your config to only warn about errors or set it to `none` to disable validation
  > entirely.

- Updated dependencies [5fcdeb75]
- Updated dependencies [250b4d11]
- Updated dependencies [f778d3e5]
- Updated dependencies [a2fb5cc6]
  - @pandacss/preset-base@0.29.0
  - @pandacss/types@0.29.0
  - @pandacss/preset-panda@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

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

### Patch Changes

- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/preset-base@0.28.0
  - @pandacss/preset-panda@0.28.0
  - @pandacss/error@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/preset-base@0.27.3
  - @pandacss/preset-panda@0.27.3
  - @pandacss/error@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/error@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/preset-base@0.27.2
- @pandacss/preset-panda@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/preset-base@0.27.1
  - @pandacss/preset-panda@0.27.1
  - @pandacss/error@0.27.1
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

- c9195a4e: ## Change

  Change the config dependencies (files that are transitively imported) detection a bit more permissive to make it work
  by default in more scenarios.

  ## Context

  This helps when you're in a monorepo and you have a workspace package for your preset, and you want to see the HMR
  reflecting changes in your app.

  Currently, we only traverse files with the `.ts` extension, this change makes it traverse all files ending with `.ts`,
  meaning that it will also traverse `.d.ts`, `.d.mts`, `.mts`, etc.

  ## Example

  ```ts
  // apps/storybook/panda.config.ts
  import { defineConfig } from "@pandacss/dev";
  import preset from "@acme/preset";

  export default defineConfig({
    // ...
  });
  ```

  This would not work before, but now it does.

  ```jsonc
  {
    "name": "@acme/preset",
    "types": "./dist/index.d.mts", // we only looked into `.ts` files, so we didnt check this
    "main": "./dist/index.js",
    "module": "./dist/index.mjs",
  }
  ```

  ## Notes

  This would have been fine before that change.

  ```jsonc
  // packages/preset/package.json
  {
    "name": "@acme/preset",
    "types": "./src/index.ts", // this was fine
    "main": "./dist/index.js",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs",
        "require": "./dist/index.js",
      },
      // ...
    },
  }
  ```

- Updated dependencies [84304901]
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
  - @pandacss/preset-panda@0.27.0
  - @pandacss/preset-base@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/error@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- Updated dependencies [f823a8c5]
  - @pandacss/preset-base@0.26.2
  - @pandacss/error@0.26.2
  - @pandacss/logger@0.26.2
  - @pandacss/preset-panda@0.26.2
  - @pandacss/shared@0.26.2
  - @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/error@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/preset-base@0.26.1
- @pandacss/preset-panda@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- 1bd7fbb7: Fix an edge-case for when the `config.outdir` would not be set in the `panda.config`

  Internal details: The `outdir` would not have any value after a config change due to the fallback being set in the
  initial config resolving code path but not in context reloading code path, moving it inside the config loading
  function fixes this issue.

- Updated dependencies [3f6b3662]
- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/preset-base@0.26.0
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/preset-panda@0.26.0
  - @pandacss/error@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0
  - @pandacss/preset-base@0.25.0
  - @pandacss/preset-panda@0.25.0
  - @pandacss/error@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/preset-base@0.24.2
  - @pandacss/preset-panda@0.24.2
  - @pandacss/error@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/error@0.24.1
- @pandacss/logger@0.24.1
- @pandacss/preset-base@0.24.1
- @pandacss/preset-panda@0.24.1
- @pandacss/shared@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/preset-base@0.24.0
  - @pandacss/preset-panda@0.24.0
  - @pandacss/error@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/error@0.23.0
  - @pandacss/preset-base@0.23.0
  - @pandacss/preset-panda@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/types@0.23.0

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
          "first-main": { value: "override" },
        },
      },
      extend: {
        tokens: {
          colors: {
            orange: { value: "orange" },
            gray: { value: "from-first-config" },
          },
        },
      },
    },
  });

  const secondConfig = definePreset({
    theme: {
      tokens: {
        colors: {
          pink: { value: "pink" },
        },
      },
      extend: {
        tokens: {
          colors: {
            blue: { value: "blue" },
            gray: { value: "gray" },
          },
        },
      },
    },
  });

  // Final config
  export default defineConfig({
    presets: [firstConfig, secondConfig],
  });
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
  import { mergeConfigs } from "@pandacss/config/merge";
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
