# @pandacss/parser

## 0.38.0

### Patch Changes

- 96b47b3: Add support for array values in the special `css` property for the JSX factory and JSX patterns

  This makes it even easier to merge styles from multiple sources.

  ```tsx
  import { Stack, styled } from "../styled-system/jsx";

  const HeroSection = (props) => {
    return (
      <Stack css={[{ color: "blue.300", padding: "4" }, props.css]}>
        <styled.div css={[{ fontSize: "2xl" }, props.hero]}>
          Hero Section
        </styled.div>
      </Stack>
    );
  };

  const App = () => {
    return (
      <>
        <HeroSection
          css={{ backgroundColor: "yellow.300" }}
          hero={css.raw({ fontSize: "4xl", color: "red.300" })}
        />
      </>
    );
  };
  ```

  should render something like:

  ```html
  <div class="d_flex flex_column gap_10px text_blue.300 p_4 bg_yellow.300">
    <div class="fs_4xl text_red.300">Hero Section</div>
  </div>
  ```

- 7a96298: Fix Panda imports detection when using `tsconfig`.`baseUrl` with an outdir that starts with `./`.
- Updated dependencies [96b47b3]
- Updated dependencies [bc09d89]
- Updated dependencies [7a96298]
- Updated dependencies [2c8b933]
  - @pandacss/types@0.38.0
  - @pandacss/core@0.38.0
  - @pandacss/shared@0.38.0
  - @pandacss/config@0.38.0
  - @pandacss/logger@0.38.0
  - @pandacss/extractor@0.38.0

## 0.37.2

### Patch Changes

- Updated dependencies [74dfb3e]
  - @pandacss/types@0.37.2
  - @pandacss/config@0.37.2
  - @pandacss/core@0.37.2
  - @pandacss/logger@0.37.2
  - @pandacss/extractor@0.37.2
  - @pandacss/shared@0.37.2

## 0.37.1

### Patch Changes

- 99870bb: Fix issue where setting the pattern `jsx` option with dot notation didn't work.

  ```jsx
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    patterns: {
      extend: {
        grid: {
          jsx: ["Form.Group", "Grid"],
        },
        stack: {
          jsx: ["Form.Action", "Stack"],
        },
      },
    },
  });
  ```

- Updated dependencies [88049c5]
- Updated dependencies [885963c]
- Updated dependencies [99870bb]
  - @pandacss/config@0.37.1
  - @pandacss/types@0.37.1
  - @pandacss/shared@0.37.1
  - @pandacss/core@0.37.1
  - @pandacss/logger@0.37.1
  - @pandacss/extractor@0.37.1

## 0.37.0

### Patch Changes

- 7daf159: Fix a bug where some styles would be grouped together in the same rule, even if they were not related to each
  other.

  ## Internal details

  This was caused by an object reference being re-used while setting a property deeply in the hashes decoding process,
  leading to the mutation of a previous style object with additional properties.

- Updated dependencies [7daf159]
- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/shared@0.37.0
  - @pandacss/types@0.37.0
  - @pandacss/core@0.37.0
  - @pandacss/config@0.37.0
  - @pandacss/extractor@0.37.0
  - @pandacss/logger@0.37.0

## 0.36.1

### Patch Changes

- 35bd134: Fix JSX matching with recipes after introducing namespace imports

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    theme: {
      extend: {
        slotRecipes: {
          tabs: {
            className: "tabs",
            slots: ["root", "list", "trigger", "content", "indicator"],
            base: {
              root: {
                display: "flex",
                // ...
              },
            },
          },
        },
      },
    },
  });
  ```

  ```tsx
  const App = () => {
    return (
      // ❌ this was not matched to the `tabs` slot recipe
      // ✅ fixed with this PR
      <Tabs.Root defaultValue="button">
        <Tabs.List>
          <Tabs.Trigger value="button">Button</Tabs.Trigger>
          <Tabs.Trigger value="radio">Radio Group</Tabs.Trigger>
          <Tabs.Trigger value="slider">Slider</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>
      </Tabs.Root>
    );
  };
  ```

  We introduced a bug in [v0.34.2](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0342---2024-03-08) where
  the `Tabs.Trigger` component was not being matched to the `tabs` slot recipe, due to the
  [new namespace import feature](https://github.com/chakra-ui/panda/pull/2371).

- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1
  - @pandacss/config@0.36.1
  - @pandacss/core@0.36.1
  - @pandacss/logger@0.36.1
  - @pandacss/extractor@0.36.1
  - @pandacss/shared@0.36.1

## 0.36.0

### Patch Changes

- Updated dependencies [445c7b6]
- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/config@0.36.0
  - @pandacss/types@0.36.0
  - @pandacss/core@0.36.0
  - @pandacss/logger@0.36.0
  - @pandacss/extractor@0.36.0
  - @pandacss/shared@0.36.0

## 0.35.0

### Patch Changes

- 50db354: Add missing reducers to properly return the results of hooks for `config:resolved` and `parser:before`
- c459b43: Fix extraction of JSX `styled` factory when using namespace imports

  ```tsx
  import * as pandaJsx from "../styled-system/jsx";

  // ✅ this will work now
  pandaJsx.styled("div", { base: { color: "red" } });
  const App = () => (
    <pandaJsx.styled.span color="blue">Hello</pandaJsx.styled.span>
  );
  ```

- Updated dependencies [50db354]
- Updated dependencies [c459b43]
- Updated dependencies [f6befbf]
- Updated dependencies [a0c4d27]
  - @pandacss/config@0.35.0
  - @pandacss/types@0.35.0
  - @pandacss/core@0.35.0
  - @pandacss/logger@0.35.0
  - @pandacss/extractor@0.35.0
  - @pandacss/shared@0.35.0

## 0.34.3

### Patch Changes

- @pandacss/config@0.34.3
- @pandacss/core@0.34.3
- @pandacss/extractor@0.34.3
- @pandacss/logger@0.34.3
- @pandacss/shared@0.34.3
- @pandacss/types@0.34.3

## 0.34.2

### Patch Changes

- 0bf09f2: Allow using namespaced imports

  ```ts
  import * as p from "styled-system/patterns";
  import * as recipes from "styled-system/recipes";
  import * as panda from "styled-system/css";

  // this will now be extracted
  p.stack({ mt: "40px" });

  recipes.cardStyle({ rounded: true });

  panda.css({ color: "red" });
  panda.cva({ base: { color: "blue" } });
  panda.sva({ base: { root: { color: "green" } } });
  ```

- Updated dependencies [0bf09f2]
- Updated dependencies [58388de]
  - @pandacss/extractor@0.34.2
  - @pandacss/core@0.34.2
  - @pandacss/config@0.34.2
  - @pandacss/types@0.34.2
  - @pandacss/logger@0.34.2
  - @pandacss/shared@0.34.2

## 0.34.1

### Patch Changes

- @pandacss/core@0.34.1
- @pandacss/config@0.34.1
- @pandacss/extractor@0.34.1
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
  - @pandacss/core@0.34.0
  - @pandacss/types@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/extractor@0.34.0
  - @pandacss/shared@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [34d94cf]
- Updated dependencies [4736057]
- Updated dependencies [8feeb95]
- Updated dependencies [5a205e7]
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/core@0.33.0
  - @pandacss/config@0.33.0
  - @pandacss/types@0.33.0
  - @pandacss/logger@0.33.0
  - @pandacss/extractor@0.33.0
  - @pandacss/shared@0.33.0

## 0.32.1

### Patch Changes

- 31071ba: Fix an issue for token names starting with '0'

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    theme: {
      tokens: {
        spacing: {
          "025": {
            value: "0.125rem",
          },
        },
      },
    },
  });
  ```

  and then using it like

  ```ts
  css({ margin: "025" });
  ```

  This would not generate the expected CSS because the parser would try to parse `025` as a number (`25`) instead of
  keeping it as a string.

- 5184771: Using colorPalette with DEFAULT values will now also override the current token path

  Given this config:

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    theme: {
      extend: {
        semanticTokens: {
          colors: {
            bg: {
              primary: {
                DEFAULT: {
                  value: "{colors.red.500}",
                },
                base: {
                  value: "{colors.green.500}",
                },
                hover: {
                  value: "{colors.yellow.300}",
                },
              },
            },
          },
        },
      },
    },
  });
  ```

  And this style usage:

  ```ts
  import { css } from "styled-system/css";

  css({
    colorPalette: "bg.primary",
  });
  ```

  This is the difference in the generated css

  ```diff
  @layer utilities {
    .color-palette_bg\\.primary {
  +    --colors-color-palette: var(--colors-bg-primary);
      --colors-color-palette-base: var(--colors-bg-primary-base);
      --colors-color-palette-hover: var(--colors-bg-primary-hover);
    }
  }
  ```

  Which means you can now directly reference the current `colorPalette` like:

  ```diff
  import { css } from 'styled-system/css'

  css({
    colorPalette: 'bg.primary',
  +  backgroundColor: 'colorPalette',
  })
  ```

- f419993: - Prevent extracting style props of `styled` when not explicitly imported

  - Allow using multiple aliases for the same identifier for the `/css` entrypoints just like `/patterns` and `/recipes`

  ```ts
  import { css } from "../styled-system/css";
  import { css as css2 } from "../styled-system/css";

  css({ display: "flex" });
  css2({ flexDirection: "column" }); // this wasn't working before, now it does
  ```

- Updated dependencies [a032375]
- Updated dependencies [31071ba]
- Updated dependencies [f419993]
- Updated dependencies [89ffb6b]
  - @pandacss/config@0.32.1
  - @pandacss/types@0.32.1
  - @pandacss/core@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/extractor@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Minor Changes

- b32d817: Switch from `em` to `rem` for breakpoints and container queries to prevent side effects.

### Patch Changes

- Updated dependencies [433a364]
- Updated dependencies [7e70b6b]
- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
- Updated dependencies [b32d817]
  - @pandacss/core@0.32.0
  - @pandacss/extractor@0.32.0
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/config@0.32.0
  - @pandacss/logger@0.32.0

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

- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [e2ad0eed]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
- Updated dependencies [ddeda8ac]
  - @pandacss/types@0.31.0
  - @pandacss/config@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/core@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/extractor@0.31.0

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

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/core@0.30.2
  - @pandacss/config@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/extractor@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- Updated dependencies [ffe177fd]
  - @pandacss/config@0.30.1
  - @pandacss/core@0.30.1
  - @pandacss/extractor@0.30.1
  - @pandacss/logger@0.30.1
  - @pandacss/shared@0.30.1
  - @pandacss/types@0.30.1

## 0.30.0

### Patch Changes

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
  - @pandacss/shared@0.30.0
  - @pandacss/core@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/extractor@0.30.0

## 0.29.1

### Patch Changes

- Updated dependencies [a5c75607]
  - @pandacss/core@0.29.1
  - @pandacss/config@0.29.1
  - @pandacss/extractor@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/types@0.29.1

## 0.29.0

### Patch Changes

- 7c7340ec: Add support for token references with curly braces like `{path.to.token}` in media queries, just like the
  `token(path.to.token)` alternative already could.

  ```ts
  css({
    // ✅ this is fine now, will resolve to something like
    // `@container (min-width: 56em)`
    "@container (min-width: {sizes.4xl})": {
      color: "green",
    },
  });
  ```

  Fix an issue where the curly token references would not be escaped if the token path was not found.

- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [f778d3e5]
- Updated dependencies [ea3f5548]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/core@0.29.0
  - @pandacss/config@0.29.0
  - @pandacss/extractor@0.29.0
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
- Updated dependencies [e463ce0e]
- Updated dependencies [77cab9fe]
- Updated dependencies [770c7aa4]
- Updated dependencies [9d000dcd]
- Updated dependencies [6d7e7b07]
  - @pandacss/config@0.28.0
  - @pandacss/types@0.28.0
  - @pandacss/core@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/extractor@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/core@0.27.3
  - @pandacss/config@0.27.3
  - @pandacss/extractor@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/config@0.27.2
- @pandacss/core@0.27.2
- @pandacss/extractor@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/config@0.27.1
  - @pandacss/core@0.27.1
  - @pandacss/extractor@0.27.1
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
- Updated dependencies [74ac0d9d]
- Updated dependencies [c9195a4e]
  - @pandacss/extractor@0.27.0
  - @pandacss/config@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0
  - @pandacss/core@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/config@0.26.2
- @pandacss/core@0.26.2
- @pandacss/extractor@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/config@0.26.1
- @pandacss/core@0.26.1
- @pandacss/extractor@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- d420c676: Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in
  ESLint Plugin and Node.js.
- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [14033e00]
- Updated dependencies [1bd7fbb7]
- Updated dependencies [d420c676]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/core@0.26.0
  - @pandacss/config@0.26.0
  - @pandacss/extractor@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- de282f60: Fix issue where `base` doesn't work within css function

  ```jsx
  css({
    // This didn't work, but now it does
    base: { color: "blue" },
  });
  ```

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0
  - @pandacss/config@0.25.0
  - @pandacss/extractor@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/config@0.24.2
  - @pandacss/extractor@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/config@0.24.1
- @pandacss/extractor@0.24.1
- @pandacss/logger@0.24.1
- @pandacss/shared@0.24.1
- @pandacss/types@0.24.1

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

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/config@0.24.0
  - @pandacss/extractor@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- 80ada336: Automatically extract/generate CSS for `sva` even if `slots` are not statically extractable, since it will
  only produce atomic styles, we don't care much about slots for `sva` specifically

  Currently the CSS won't be generated if the `slots` are missing which can be problematic when getting them from
  another file, such as when using `Ark-UI` like `import { comboboxAnatomy } from '@ark-ui/anatomy'`

  ```ts
  import { sva } from "../styled-system/css";
  import { slots } from "./slots";

  const card = sva({
    slots, // ❌ did NOT work -> ✅ will now work as expected
    base: {
      root: {
        p: "6",
        m: "4",
        w: "md",
        boxShadow: "md",
        borderRadius: "md",
        _dark: { bg: "#262626", color: "white" },
      },
      content: {
        textStyle: "lg",
      },
      title: {
        textStyle: "xl",
        fontWeight: "semibold",
        pb: "2",
      },
    },
  });
  ```

- b01eb049: Fix a parser issue where we didn't handle import aliases when using a {xxx}.raw() function.

  ex:

  ```ts
  // button.stories.ts
  import { button as buttonRecipe } from "@ui/styled-system/recipes";

  export const Primary: Story = {
    // ❌ this wouldn't be parsed as a recipe because of the alias + .raw()
    //  -> ✅ it's now fixed
    args: buttonRecipe.raw({
      color: "primary",
    }),
  };
  ```

- a3b6ed5f: Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal
  parsing when not using `config.syntax` set to "template-literal"
- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/config@0.23.0
  - @pandacss/extractor@0.23.0
  - @pandacss/is-valid-prop@0.23.0
  - @pandacss/shared@0.23.0
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
  - @pandacss/extractor@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/config@0.22.0
  - @pandacss/extractor@0.22.0
  - @pandacss/is-valid-prop@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [1464460f]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/extractor@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/config@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/config@0.20.1
- @pandacss/extractor@0.20.1
- @pandacss/is-valid-prop@0.20.1
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
  - @pandacss/extractor@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/config@0.19.0
  - @pandacss/extractor@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/config@0.18.3
- @pandacss/extractor@0.18.3
- @pandacss/is-valid-prop@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/shared@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/config@0.18.2
- @pandacss/extractor@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- @pandacss/config@0.18.1
- @pandacss/extractor@0.18.1
- @pandacss/is-valid-prop@0.18.1
- @pandacss/logger@0.18.1
- @pandacss/shared@0.18.1
- @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
- Updated dependencies [336fd0b0]
  - @pandacss/shared@0.18.0
  - @pandacss/extractor@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/config@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/config@0.17.5
- @pandacss/extractor@0.17.5
- @pandacss/is-valid-prop@0.17.5
- @pandacss/logger@0.17.5
- @pandacss/shared@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/config@0.17.4
  - @pandacss/extractor@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/config@0.17.3
  - @pandacss/extractor@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/config@0.17.2
- @pandacss/extractor@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [a76b279e]
- Updated dependencies [5ce359f6]
  - @pandacss/extractor@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/config@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/config@0.17.0
  - @pandacss/extractor@0.17.0
  - @pandacss/is-valid-prop@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- @pandacss/config@0.16.0
- @pandacss/extractor@0.16.0
- @pandacss/is-valid-prop@0.16.0
- @pandacss/logger@0.16.0
- @pandacss/shared@0.16.0
- @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/config@0.15.5
- @pandacss/extractor@0.15.5
- @pandacss/is-valid-prop@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/shared@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- bf0e6a30: Fix issues with class merging in the `styled` factory fn for Qwik, Solid and Vue.
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

- 3a04a927: Fix static extraction of the
  [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax) when used with runtime
  conditions

  Given a component like this:

  ```ts
  function App() {
    return <Box py={[2, verticallyCondensed ? 2 : 3, 4]} />
  }
  ```

  the `py` value was incorrectly extracted like this:

  ```ts
   {
      "py": {
          "1": 2,
      },
  },
  {
      "py": {
          "1": 3,
      },
  },
  ```

  which would then generate invalid CSS like:

  ```css
  .paddingBlock\\\\:1_2 {
    1: 2px;
  }

  .paddingBlock\\\\:1_3 {
    1: 3px;
  }
  ```

  it's now correctly transformed back to an array:

  ```diff
  {
    "py": {
  -    "1": 2,
  +   [
  +       undefined,
  +       2,
  +   ]
    },
  },
  {
    "py": {
  -    "1": 3,
  +   [
  +       undefined,
  +       3,
  +   ]
    },
  },
  ```

  which will generate the correct CSS

  ```css
  @media screen and (min-width: 40em) {
    .sm\\\\:py_2 {
      padding-block: var(--spacing-2);
    }

    .sm\\\\:py_3 {
      padding-block: var(--spacing-3);
    }
  }
  ```

- Updated dependencies [abd7c47a]
- Updated dependencies [3a04a927]
  - @pandacss/config@0.15.4
  - @pandacss/extractor@0.15.4
  - @pandacss/types@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4

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

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/config@0.15.3
  - @pandacss/extractor@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
- Updated dependencies [2645c2da]
  - @pandacss/types@0.15.2
  - @pandacss/config@0.15.2
  - @pandacss/extractor@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- c40ae1b9: feat(parser): extract {fn}.raw as an identity fn

  so this will now work:

  ```ts
  import { css } from "styled-system/css";

  const paragraphSpacingStyle = css.raw({
    "&:not(:first-child)": { marginBlockEnd: "1em" },
  });

  export const proseCss = css.raw({
    maxWidth: "800px",
    "& p": {
      "&:not(:first-child)": { marginBlockStart: "1em" },
    },
    "& h1": paragraphSpacingStyle,
    "& h2": paragraphSpacingStyle,
  });
  ```

  & use ECMA preset for ts-evaluator: This means that no other globals than those that are defined in the ECMAScript
  spec such as Math, Promise, Object, etc, are available but it allows for some basic evaluation of expressions like
  this:

  ```ts
  import { cva } from ".panda/css";

  const variants = () => {
    const spacingTokens = Object.entries({
      s: "token(spacing.1)",
      m: "token(spacing.2)",
      l: "token(spacing.3)",
    });

    const spacingProps = {
      px: "paddingX",
      py: "paddingY",
    };

    // Generate variants programmatically
    return Object.entries(spacingProps)
      .map(([name, styleProp]) => {
        const variants = spacingTokens
          .map(([variant, token]) => ({ [variant]: { [styleProp]: token } }))
          .reduce((_agg, kv) => ({ ..._agg, ...kv }));

        return { [name]: variants };
      })
      .reduce((_agg, kv) => ({ ..._agg, ...kv }));
  };

  const baseStyle = cva({
    variants: variants(),
  });
  ```

- Updated dependencies [c40ae1b9]
- Updated dependencies [26f6982c]
  - @pandacss/extractor@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/config@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [be24d1a0]
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [7c1ab170]
- Updated dependencies [f27146d6]
  - @pandacss/extractor@0.15.0
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/config@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/config@0.14.0
  - @pandacss/extractor@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- 577dcb9d: Fix issue where Panda does not detect styles after nested template in vue
- Updated dependencies [d0fbc7cc]
  - @pandacss/config@0.13.1
  - @pandacss/extractor@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/config@0.13.0
- @pandacss/extractor@0.13.0
- @pandacss/is-valid-prop@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/config@0.12.2
- @pandacss/extractor@0.12.2
- @pandacss/is-valid-prop@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/config@0.12.1
- @pandacss/extractor@0.12.1
- @pandacss/is-valid-prop@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/config@0.12.0
- @pandacss/extractor@0.12.0
- @pandacss/is-valid-prop@0.12.0
- @pandacss/logger@0.12.0
- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/config@0.11.1
  - @pandacss/extractor@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [dead08a2]
- Updated dependencies [5b95caf5]
  - @pandacss/config@0.11.0
  - @pandacss/types@0.11.0
  - @pandacss/extractor@0.11.0
  - @pandacss/is-valid-prop@0.11.0
  - @pandacss/logger@0.11.0
  - @pandacss/shared@0.11.0

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
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/config@0.10.0
  - @pandacss/extractor@0.10.0
  - @pandacss/logger@0.10.0

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
- Updated dependencies [3269b411]
  - @pandacss/types@0.9.0
  - @pandacss/extractor@0.9.0
  - @pandacss/config@0.9.0
  - @pandacss/is-valid-prop@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Minor Changes

- 9ddf258b: Introduce the new `{fn}.raw` method that allows for a super flexible usage and extraction :tada: :

  ```tsx
  <Button rootProps={css.raw({ bg: "red.400" })} />

  // recipe in storybook
  export const Funky: Story = {
  	args: button.raw({
  		visual: "funky",
  		shape: "circle",
  		size: "sm",
  	}),
  };

  // mixed with pattern
  const stackProps = {
    sm: stack.raw({ direction: "column" }),
    md: stack.raw({ direction: "row" })
  }

  stack(stackProps[props.size]))
  ```

### Patch Changes

- fb449016: Fix cases where Stitches `styled.withConfig` would be misinterpreted as a panda fn and lead to this error:

  ```ts
  TypeError: Cannot read properties of undefined (reading 'startsWith')
      at /panda/packages/shared/dist/index.js:433:16
      at get (/panda/packages/shared/dist/index.js:116:20)
      at Utility.setClassName (/panda/packages/core/dist/index.js:1682:66)
      at inner (/panda/packages/core/dist/index.js:1705:14)
      at Utility.getOrCreateClassName (/panda/packages/core/dist/index.js:1709:12)
      at AtomicRule.transform (/panda/packages/core/dist/index.js:1729:23)
      at /panda/packages/core/dist/index.js:323:32
      at inner (/panda/packages/shared/dist/index.js:219:12)
      at walkObject (/panda/packages/shared/dist/index.js:221:10)
      at AtomicRule.process (/panda/packages/core/dist/index.js:317:35)
  ```

- be0ad578: Fix parser issue with TS path mappings
- 78612d7f: Fix node evaluation in extractor process (can happen when using a BinaryExpression, simple CallExpression or
  conditions)
- Updated dependencies [fb449016]
- Updated dependencies [e1f6318a]
- Updated dependencies [be0ad578]
- Updated dependencies [78612d7f]
  - @pandacss/extractor@0.8.0
  - @pandacss/config@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- 16cd3764: Fix parser issue in `.vue` files, make the traversal check nested elements instead of only checking the 1st
  level
- 7bc69e4b: Fix issue where extraction does not work when the spread syntax is used or prop contains string that ends
  with ':'
- Updated dependencies [f2abf34d]
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
- Updated dependencies [7bc69e4b]
  - @pandacss/extractor@0.7.0
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 5bd88c41: Fix JSX recipe extraction when multiple recipes were used on the same component, ex:

  ```tsx
  const ComponentWithMultipleRecipes = ({ variant }) => {
    return (
      <button
        className={cx(
          pinkRecipe({ variant }),
          greenRecipe({ variant }),
          blueRecipe({ variant }),
        )}
      >
        Hello
      </button>
    );
  };
  ```

  Given a `panda.config.ts` with recipes each including a common `jsx` tag name, such as:

  ```ts
  recipes: {
      pinkRecipe: {
          className: 'pinkRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'pink.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
      greenRecipe: {
          className: 'greenRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'green.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
      blueRecipe: {
          className: 'blueRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'blue.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
  },
  ```

  Only the first matching recipe would be noticed and have its CSS generated, now this will properly generate the CSS
  for each of them

- b50675ca: Refactor parser to support extracting `css` prop in JSX elements correctly.
- Updated dependencies [21295f2e]
  - @pandacss/extractor@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 09ebaf2e: Fix svelte parsing when using Typescript or `<script context=module>` or multiple `<script>`s
- 78ed6ed4: Fix issue where using a nested outdir like `src/styled-system` with a baseUrl like `./src` would result on
  parser NOT matching imports like `import { container } from "styled-system/patterns";` cause it would expect the full
  path `src/styled-system`
- a3d760ce: Do not allow all JSX properties to be extracted if none provided, rely on the `isStyleProp` fn instead

  This fixes cases when :

  - `eject: true` and only the `@pandacss/preset-base` is used (or none)
  - some non-styling JSX prop is extracted leading to an incorrect CSS rule being generated, ex:

  ```sh
  🐼 info [cli] Writing /Users/astahmer/dev/reproductions/remix-panda/styled-system/debug/app__routes___index.css
  🐼 error [serializer:css] Failed to serialize CSS: CssSyntaxError: <css input>:28:19: Missed semicolon

    26 |     }
    27 |     .src_https\:\/\/akmweb\.viztatech\.com\/web\/svnres\/file\/50_e4bb32c9ea75c5de397f2dc17a3cf186\.jpg {
  > 28 |         src: https://akmweb.viztatech.com/web/svnres/file/50_e4bb32c9ea75c5de397f2dc17a3cf186.jpg
       |                   ^
    29 |     }
    30 | }
  ```

- Updated dependencies [6f03ead3]
- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
- Updated dependencies [e48b130a]
- Updated dependencies [d9bc63e7]
  - @pandacss/extractor@0.5.1
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/is-valid-prop@0.5.1

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

- 30f41e01: Fix parsing of factory recipe with property access + object syntax, such as:

  ```ts
  const Input = styled.input({
    base: {
      color: "blue.100",
      bg: "blue.900",
    },
  });
  ```

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/extractor@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/is-valid-prop@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- 8991b1e4: - Experimental support for `.vue` files and better `.svelte` support
  - Fix issue where the `panda ship` command does not write to the correct path
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/extractor@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/extractor@0.3.2
- @pandacss/is-valid-prop@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/extractor@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/extractor@0.3.0
  - @pandacss/is-valid-prop@0.3.0
  - @pandacss/logger@0.3.0
  - @pandacss/shared@0.3.0

## 0.0.2

### Patch Changes

- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.

- Updated dependencies [c308e8be]
- Updated dependencies [fb40fff2]
  - @pandacss/types@0.0.2
  - @pandacss/extractor@0.0.2
  - @pandacss/is-valid-prop@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
