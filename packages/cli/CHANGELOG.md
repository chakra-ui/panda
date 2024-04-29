# @pandacss/dev

## 0.38.0

### Patch Changes

- Updated dependencies [96b47b3]
- Updated dependencies [bc09d89]
- Updated dependencies [2c8b933]
  - @pandacss/types@0.38.0
  - @pandacss/token-dictionary@0.38.0
  - @pandacss/shared@0.38.0
  - @pandacss/node@0.38.0
  - @pandacss/config@0.38.0
  - @pandacss/logger@0.38.0
  - @pandacss/preset-panda@0.38.0
  - @pandacss/postcss@0.38.0

## 0.37.2

### Patch Changes

- d238b17: Add missing type PatternProperties to solve a TypeScript issue (The inferred type of xxx cannot be named
  without a reference)
- Updated dependencies [84edd38]
- Updated dependencies [74dfb3e]
  - @pandacss/node@0.37.2
  - @pandacss/types@0.37.2
  - @pandacss/postcss@0.37.2
  - @pandacss/config@0.37.2
  - @pandacss/logger@0.37.2
  - @pandacss/preset-panda@0.37.2
  - @pandacss/token-dictionary@0.37.2
  - @pandacss/shared@0.37.2

## 0.37.1

### Patch Changes

- Updated dependencies [93dc9f5]
- Updated dependencies [88049c5]
- Updated dependencies [885963c]
- Updated dependencies [99870bb]
  - @pandacss/token-dictionary@0.37.1
  - @pandacss/config@0.37.1
  - @pandacss/types@0.37.1
  - @pandacss/shared@0.37.1
  - @pandacss/node@0.37.1
  - @pandacss/logger@0.37.1
  - @pandacss/preset-panda@0.37.1
  - @pandacss/postcss@0.37.1

## 0.37.0

### Patch Changes

- Updated dependencies [7daf159]
- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/shared@0.37.0
  - @pandacss/types@0.37.0
  - @pandacss/node@0.37.0
  - @pandacss/config@0.37.0
  - @pandacss/token-dictionary@0.37.0
  - @pandacss/logger@0.37.0
  - @pandacss/preset-panda@0.37.0
  - @pandacss/postcss@0.37.0

## 0.36.1

### Patch Changes

- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1
  - @pandacss/node@0.36.1
  - @pandacss/config@0.36.1
  - @pandacss/logger@0.36.1
  - @pandacss/preset-panda@0.36.1
  - @pandacss/token-dictionary@0.36.1
  - @pandacss/postcss@0.36.1
  - @pandacss/shared@0.36.1

## 0.36.0

### Minor Changes

- 2691f16: Add `config.themes` to easily define and apply a theme on multiple tokens at once, using data attributes and
  CSS variables.

  Can pre-generate multiple themes with token overrides as static CSS, but also dynamically import and inject a theme
  stylesheet at runtime (browser or server).

  Example:

  ```ts
  // panda.config.ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    // main theme
    theme: {
      extend: {
        tokens: {
          colors: {
            text: { value: "blue" },
          },
        },
        semanticTokens: {
          colors: {
            body: {
              value: {
                base: "{colors.blue.600}",
                _osDark: "{colors.blue.400}",
              },
            },
          },
        },
      },
    },
    // alternative theme variants
    themes: {
      primary: {
        tokens: {
          colors: {
            text: { value: "red" },
          },
        },
        semanticTokens: {
          colors: {
            muted: { value: "{colors.red.200}" },
            body: {
              value: {
                base: "{colors.red.600}",
                _osDark: "{colors.red.400}",
              },
            },
          },
        },
      },
      secondary: {
        tokens: {
          colors: {
            text: { value: "blue" },
          },
        },
        semanticTokens: {
          colors: {
            muted: { value: "{colors.blue.200}" },
            body: {
              value: {
                base: "{colors.blue.600}",
                _osDark: "{colors.blue.400}",
              },
            },
          },
        },
      },
    },
  });
  ```

  ### Pregenerating themes

  By default, no additional theme variant is generated, you need to specify the specific themes you want to generate in
  `staticCss.themes` to include them in the CSS output.

  ```ts
  // panda.config.ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    staticCss: {
      themes: ["primary", "secondary"],
    },
  });
  ```

  This will generate the following CSS:

  ```css
  @layer tokens {
    :where(:root, :host) {
      --colors-text: blue;
      --colors-body: var(--colors-blue-600);
    }

    [data-panda-theme="primary"] {
      --colors-text: red;
      --colors-muted: var(--colors-red-200);
      --colors-body: var(--colors-red-600);
    }

    @media (prefers-color-scheme: dark) {
      :where(:root, :host) {
        --colors-body: var(--colors-blue-400);
      }

      [data-panda-theme="primary"] {
        --colors-body: var(--colors-red-400);
      }
    }
  }
  ```

  ***

  An alternative way of applying a theme is by using the new `styled-system/themes` entrypoint where you can import the
  themes CSS variables and use them in your app.

  > ℹ️ The `styled-system/themes` will always contain every themes (tree-shaken if not used), `staticCss.themes` only
  > applies to the CSS output.

  Each theme has a corresponding JSON file with a similar structure:

  ```json
  {
    "name": "primary",
    "id": "panda-themes-primary",
    "dataAttr": "primary",
    "css": "[data-panda-theme=primary] { ... }"
  }
  ```

  > ℹ️ Note that for semantic tokens, you need to use inject the theme styles, see below

  Dynamically import a theme using its name:

  ```ts
  import { getTheme } from "../styled-system/themes";

  const theme = await getTheme("red");
  //    ^? {
  //     name: "red";
  //     id: string;
  //     css: string;
  // }
  ```

  Inject the theme styles into the DOM:

  ```ts
  import { injectTheme } from "../styled-system/themes";

  const theme = await getTheme("red");
  injectTheme(document.documentElement, theme); // this returns the injected style element
  ```

  ***

  SSR example with NextJS:

  ```tsx
  // app/layout.tsx
  import { Inter } from "next/font/google";
  import { cookies } from "next/headers";
  import { ThemeName, getTheme } from "../../styled-system/themes";

  export default async function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const store = cookies();
    const themeName = store.get("theme")?.value as ThemeName;
    const theme = themeName && (await getTheme(themeName));

    return (
      <html lang="en" data-panda-theme={themeName ? themeName : undefined}>
        {themeName && (
          <head>
            <style
              type="text/css"
              id={theme.id}
              dangerouslySetInnerHTML={{ __html: theme.css }}
            />
          </head>
        )}
        <body>{children}</body>
      </html>
    );
  }

  // app/page.tsx
  import { getTheme, injectTheme } from "../../styled-system/themes";

  export default function Home() {
    return (
      <>
        <button
          onClick={async () => {
            const current = document.documentElement.dataset.pandaTheme;
            const next = current === "primary" ? "secondary" : "primary";
            const theme = await getTheme(next);
            setCookie("theme", next, 7);
            injectTheme(document.documentElement, theme);
          }}
        >
          swap theme
        </button>
      </>
    );
  }

  // Set a Cookie
  function setCookie(cName: string, cValue: any, expDays: number) {
    let date = new Date();
    date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
  }
  ```

  ***

  Finally, you can create a theme contract to ensure that all themes have the same structure:

  ```ts
  import { defineThemeContract } from "@pandacss/dev";

  const defineTheme = defineThemeContract({
    tokens: {
      colors: {
        red: { value: "" }, // theme implementations must have a red color
      },
    },
  });

  defineTheme({
    selector: ".theme-secondary",
    tokens: {
      colors: {
        // ^^^^   Property 'red' is missing in type '{}' but required in type '{ red: { value: string; }; }'
        //
        // fixed with
        // red: { value: 'red' },
      },
    },
  });
  ```

### Patch Changes

- Updated dependencies [445c7b6]
- Updated dependencies [3af3940]
- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/config@0.36.0
  - @pandacss/token-dictionary@0.36.0
  - @pandacss/types@0.36.0
  - @pandacss/node@0.36.0
  - @pandacss/logger@0.36.0
  - @pandacss/preset-panda@0.36.0
  - @pandacss/postcss@0.36.0
  - @pandacss/shared@0.36.0

## 0.35.0

### Patch Changes

- Updated dependencies [f2fdc48]
- Updated dependencies [50db354]
- Updated dependencies [f6befbf]
- Updated dependencies [888feae]
- Updated dependencies [a0c4d27]
  - @pandacss/token-dictionary@0.35.0
  - @pandacss/config@0.35.0
  - @pandacss/types@0.35.0
  - @pandacss/postcss@0.35.0
  - @pandacss/node@0.35.0
  - @pandacss/logger@0.35.0
  - @pandacss/preset-panda@0.35.0
  - @pandacss/shared@0.35.0

## 0.34.3

### Patch Changes

- @pandacss/node@0.34.3
- @pandacss/postcss@0.34.3
- @pandacss/config@0.34.3
- @pandacss/logger@0.34.3
- @pandacss/preset-panda@0.34.3
- @pandacss/shared@0.34.3
- @pandacss/token-dictionary@0.34.3
- @pandacss/types@0.34.3

## 0.34.2

### Patch Changes

- Updated dependencies [58388de]
  - @pandacss/config@0.34.2
  - @pandacss/node@0.34.2
  - @pandacss/types@0.34.2
  - @pandacss/postcss@0.34.2
  - @pandacss/logger@0.34.2
  - @pandacss/preset-panda@0.34.2
  - @pandacss/shared@0.34.2
  - @pandacss/token-dictionary@0.34.2

## 0.34.1

### Patch Changes

- Updated dependencies [d4942e0]
  - @pandacss/token-dictionary@0.34.1
  - @pandacss/node@0.34.1
  - @pandacss/postcss@0.34.1
  - @pandacss/config@0.34.1
  - @pandacss/logger@0.34.1
  - @pandacss/preset-panda@0.34.1
  - @pandacss/shared@0.34.1
  - @pandacss/types@0.34.1

## 0.34.0

### Patch Changes

- Updated dependencies [1c63216]
- Updated dependencies [64d5144]
- Updated dependencies [d1516c8]
- Updated dependencies [9f04427]
  - @pandacss/config@0.34.0
  - @pandacss/token-dictionary@0.34.0
  - @pandacss/types@0.34.0
  - @pandacss/node@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/preset-panda@0.34.0
  - @pandacss/postcss@0.34.0
  - @pandacss/shared@0.34.0

## 0.33.0

### Patch Changes

- 1968da5: Allow dynamically recording profiling session by pressing the `p` key in your terminal when using the
  `--cpu-prof` flag for long-running sessions (with `-w` or `--watch` for `panda` / `panda cssgen` / `panda codegen`).
- 8feeb95: Add `definePlugin` config functions for type-safety around plugins, add missing `plugins` in config
  dependencies to trigger a config reload on `plugins` change
- Updated dependencies [34d94cf]
- Updated dependencies [1968da5]
- Updated dependencies [e855c64]
- Updated dependencies [8feeb95]
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/token-dictionary@0.33.0
  - @pandacss/node@0.33.0
  - @pandacss/config@0.33.0
  - @pandacss/types@0.33.0
  - @pandacss/postcss@0.33.0
  - @pandacss/logger@0.33.0
  - @pandacss/preset-panda@0.33.0
  - @pandacss/shared@0.33.0

## 0.32.1

### Patch Changes

- Updated dependencies [a032375]
- Updated dependencies [5184771]
- Updated dependencies [6d8c884]
- Updated dependencies [89ffb6b]
  - @pandacss/config@0.32.1
  - @pandacss/types@0.32.1
  - @pandacss/token-dictionary@0.32.1
  - @pandacss/node@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/preset-panda@0.32.1
  - @pandacss/postcss@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Patch Changes

- ba67381: Fix issue in `defineParts` where it silently fails if a part not defined is used. It now errors with a
  helpful message
- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/config@0.32.0
  - @pandacss/node@0.32.0
  - @pandacss/token-dictionary@0.32.0
  - @pandacss/logger@0.32.0
  - @pandacss/preset-panda@0.32.0
  - @pandacss/postcss@0.32.0

## 0.31.0

### Minor Changes

- a17fe387: - Add a `config.polyfill` option that will polyfill the CSS @layer at-rules using a
  [postcss plugin](https://www.npmjs.com/package/@csstools/postcss-cascade-layers)
  - And `--polyfill` flag to `panda` and `panda cssgen` commands

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
  - @pandacss/node@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/preset-panda@0.31.0
  - @pandacss/token-dictionary@0.31.0
  - @pandacss/postcss@0.31.0

## 0.30.2

### Patch Changes

- f4ef1ed8: Fix issue where the param for `--outdir` was missing, leading to errors
- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/node@0.30.2
  - @pandacss/config@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/preset-panda@0.30.2
  - @pandacss/token-dictionary@0.30.2
  - @pandacss/postcss@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- Updated dependencies [ffe177fd]
  - @pandacss/config@0.30.1
  - @pandacss/node@0.30.1
  - @pandacss/postcss@0.30.1
  - @pandacss/logger@0.30.1
  - @pandacss/preset-panda@0.30.1
  - @pandacss/shared@0.30.1
  - @pandacss/token-dictionary@0.30.1
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
- Updated dependencies [05686b9d]
- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [ab32d1d7]
- Updated dependencies [49c760cd]
- Updated dependencies [d5977c24]
  - @pandacss/config@0.30.0
  - @pandacss/node@0.30.0
  - @pandacss/types@0.30.0
  - @pandacss/token-dictionary@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/postcss@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/preset-panda@0.30.0

## 0.29.1

### Patch Changes

- Updated dependencies [a5c75607]
  - @pandacss/node@0.29.1
  - @pandacss/postcss@0.29.1
  - @pandacss/config@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/preset-panda@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
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

- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [ea3f5548]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/config@0.29.0
  - @pandacss/node@0.29.0
  - @pandacss/preset-panda@0.29.0
  - @pandacss/postcss@0.29.0
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

- f255342f: Add a `--cpu-prof` flag to `panda`, `panda cssgen`, `panda codegen` and `panda debug` commands This is
  useful for debugging performance issues in `panda` itself. This will generate a
  `panda-{command}-{timestamp}.cpuprofile` file in the current working directory, which can be opened in tools like
  [Speedscope](https://www.speedscope.app/)

  This is mostly intended for maintainers or can be asked by maintainers to help debug issues.

- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [f255342f]
- Updated dependencies [d4fa5de9]
  - @pandacss/config@0.28.0
  - @pandacss/types@0.28.0
  - @pandacss/node@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/preset-panda@0.28.0
  - @pandacss/postcss@0.28.0
  - @pandacss/error@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
- Updated dependencies [39d10c79]
  - @pandacss/types@0.27.3
  - @pandacss/node@0.27.3
  - @pandacss/config@0.27.3
  - @pandacss/preset-panda@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/postcss@0.27.3
  - @pandacss/error@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- bfa8b1ee: Switch back to `node:path` from `pathe` to resolve issues with windows path in PostCSS + Webpack set up
- Updated dependencies [bfa8b1ee]
  - @pandacss/node@0.27.2
  - @pandacss/postcss@0.27.2
  - @pandacss/config@0.27.2
  - @pandacss/error@0.27.2
  - @pandacss/logger@0.27.2
  - @pandacss/preset-panda@0.27.2
  - @pandacss/shared@0.27.2
  - @pandacss/token-dictionary@0.27.2
  - @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/postcss@0.27.1
  - @pandacss/node@0.27.1
  - @pandacss/types@0.27.1
  - @pandacss/config@0.27.1
  - @pandacss/preset-panda@0.27.1
  - @pandacss/token-dictionary@0.27.1
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

- Updated dependencies [84304901]
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
- Updated dependencies [c9195a4e]
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/preset-panda@0.27.0
  - @pandacss/postcss@0.27.0
  - @pandacss/config@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/error@0.27.0
  - @pandacss/types@0.27.0
  - @pandacss/node@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/config@0.26.2
- @pandacss/node@0.26.2
- @pandacss/postcss@0.26.2
- @pandacss/error@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/preset-panda@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/node@0.26.1
- @pandacss/postcss@0.26.1
- @pandacss/config@0.26.1
- @pandacss/error@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/preset-panda@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [1bd7fbb7]
- Updated dependencies [1bd7fbb7]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/config@0.26.0
  - @pandacss/node@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/preset-panda@0.26.0
  - @pandacss/postcss@0.26.0
  - @pandacss/error@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [bc154358]
- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/node@0.25.0
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/postcss@0.25.0
  - @pandacss/config@0.25.0
  - @pandacss/preset-panda@0.25.0
  - @pandacss/error@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- b2e00ca0: Fix an issue with the `panda init` command which didn't update existing `.gitignore` to include the
  `styled-system`
- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/config@0.24.2
  - @pandacss/node@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/preset-panda@0.24.2
  - @pandacss/postcss@0.24.2
  - @pandacss/error@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- Updated dependencies [10e74428]
  - @pandacss/node@0.24.1
  - @pandacss/postcss@0.24.1
  - @pandacss/config@0.24.1
  - @pandacss/error@0.24.1
  - @pandacss/logger@0.24.1
  - @pandacss/preset-panda@0.24.1
  - @pandacss/shared@0.24.1
  - @pandacss/token-dictionary@0.24.1
  - @pandacss/types@0.24.1

## 0.24.0

### Minor Changes

- 63b3f1f2: - Boost style extraction performance by moving more work away from postcss
  - Using a hashing strategy, the compiler only computes styles/classname once per style object and prop-value-condition
    pair
  - Fix regression in previous implementation that increased memory usage per extraction, leading to slower performance
    over time

### Patch Changes

- Updated dependencies [63b3f1f2]
- Updated dependencies [f6881022]
  - @pandacss/node@0.24.0
  - @pandacss/types@0.24.0
  - @pandacss/postcss@0.24.0
  - @pandacss/config@0.24.0
  - @pandacss/preset-panda@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/error@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Minor Changes

- 1efc4277: Add support for emit-pkg command to emit just the `package.json` file with the required entrypoints. If an
  existing `package.json` file is present, the `exports` field will be updated.

  When setting up Panda in a monorepo, this command is useful in monorepo setups where you want the codegen to run only
  in a dedicated workspace package.

### Patch Changes

- Updated dependencies [1ea7459c]
- Updated dependencies [383b6d1b]
- Updated dependencies [bd552b1f]
- Updated dependencies [840ed66b]
  - @pandacss/node@0.23.0
  - @pandacss/logger@0.23.0
  - @pandacss/postcss@0.23.0
  - @pandacss/config@0.23.0
  - @pandacss/error@0.23.0
  - @pandacss/preset-panda@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [0f7793c7]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/postcss@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/node@0.22.1
  - @pandacss/config@0.22.1
  - @pandacss/preset-panda@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [a2f6c2c8]
- Updated dependencies [11753fea]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/node@0.22.0
  - @pandacss/config@0.22.0
  - @pandacss/preset-panda@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/postcss@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [7f846be2]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/node@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/postcss@0.21.0
  - @pandacss/config@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/preset-panda@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/config@0.20.1
- @pandacss/node@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/postcss@0.20.1
- @pandacss/error@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/preset-panda@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- da7a5d59: Add a --watch flag to the `panda ship` command
- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/postcss@0.20.0
  - @pandacss/config@0.20.0
  - @pandacss/types@0.20.0
  - @pandacss/node@0.20.0
  - @pandacss/preset-panda@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Minor Changes

- b3ca8412: Require explicit installation of `@pandacss/studio` to use the `panda studio` command.

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/node@0.19.0
  - @pandacss/config@0.19.0
  - @pandacss/preset-panda@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/postcss@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- Updated dependencies [a30f660d]
  - @pandacss/studio@0.18.3
  - @pandacss/node@0.18.3
  - @pandacss/postcss@0.18.3
  - @pandacss/config@0.18.3
  - @pandacss/error@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/preset-panda@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/config@0.18.2
- @pandacss/node@0.18.2
- @pandacss/studio@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/postcss@0.18.2
- @pandacss/error@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/preset-panda@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [aac7b379]
- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/studio@0.18.1
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/config@0.18.1
  - @pandacss/node@0.18.1
  - @pandacss/postcss@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/preset-panda@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- 41563f56: Add `--strict-tokens` flag and question in the interactive CLI
- 866c12aa: Fix CLI interactive mode `syntax` question values and prettify the generated `panda.config.ts` file
- Updated dependencies [ba9e32fa]
- Updated dependencies [b840e469]
- Updated dependencies [3010af28]
- Updated dependencies [866c12aa]
  - @pandacss/shared@0.18.0
  - @pandacss/studio@0.18.0
  - @pandacss/node@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/postcss@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/config@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/logger@0.18.0
  - @pandacss/preset-panda@0.18.0

## 0.17.5

### Patch Changes

- Updated dependencies [17f68b3f]
- Updated dependencies [abe35313]
  - @pandacss/node@0.17.5
  - @pandacss/studio@0.17.5
  - @pandacss/postcss@0.17.5
  - @pandacss/config@0.17.5
  - @pandacss/error@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/preset-panda@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [a031d077]
- Updated dependencies [fa77080a]
  - @pandacss/studio@0.17.4
  - @pandacss/types@0.17.4
  - @pandacss/config@0.17.4
  - @pandacss/node@0.17.4
  - @pandacss/preset-panda@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/postcss@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4
  - @pandacss/symlink@0.17.4

## 0.17.3

### Patch Changes

- ba10b419: Mark `defineTokens` and `defineSemanticTokens` with pure annotation to treeshake from bundle when using
  within component library.
- Updated dependencies [529a262e]
- Updated dependencies [60f2c8a3]
- Updated dependencies [128e0b19]
  - @pandacss/types@0.17.3
  - @pandacss/node@0.17.3
  - @pandacss/postcss@0.17.3
  - @pandacss/config@0.17.3
  - @pandacss/preset-panda@0.17.3
  - @pandacss/studio@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3
  - @pandacss/symlink@0.17.3

## 0.17.2

### Patch Changes

- 443ac85a: Fix an issue with the CLI, using the dev mode instead of the prod mode even when installed from npm.

  This resolves the following errors:

  ```
   Error: Cannot find module 'resolve.exports'
  ```

  ```
  Error: Cannot find module './src/cli-main'
  ```

- Updated dependencies [443ac85a]
  - @pandacss/postcss@0.17.2
  - @pandacss/symlink@0.17.2
  - @pandacss/config@0.17.2
  - @pandacss/error@0.17.2
  - @pandacss/logger@0.17.2
  - @pandacss/node@0.17.2
  - @pandacss/preset-panda@0.17.2
  - @pandacss/shared@0.17.2
  - @pandacss/studio@0.17.2
  - @pandacss/token-dictionary@0.17.2
  - @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 87772c7c: Add `--host` and `--port` flags to studio.
- Updated dependencies [56299cb2]
- Updated dependencies [87772c7c]
- Updated dependencies [7b981422]
- Updated dependencies [ddcaf7b2]
- Updated dependencies [5ce359f6]
  - @pandacss/postcss@0.17.1
  - @pandacss/node@0.17.1
  - @pandacss/studio@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/config@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/logger@0.17.1
  - @pandacss/preset-panda@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [dd6811b3]
  - @pandacss/shared@0.17.0
  - @pandacss/node@0.17.0
  - @pandacss/studio@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/postcss@0.17.0
  - @pandacss/config@0.17.0
  - @pandacss/preset-panda@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Minor Changes

- 36252b1d: ## --minimal flag

  Adds a new `--minimal` flag for the CLI on the `panda cssgen` command to skip generating CSS for theme tokens,
  preflightkeyframes, static and global css

  Thich means that the generated CSS will only contain the CSS related to the styles found in the included files.

  > Note that you can use a `glob` to override the `config.include` option like this:
  > `panda cssgen "src/**/*.css" --minimal`

  This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

  Use it like this:

  ```bash
  panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
  ```

  ***

  ## cssgen {type}

  In addition to the optional `glob` that you can already pass to override the config.include option, the `panda cssgen`
  command now accepts a new `{type}` argument to generate only a specific type of CSS:

  - preflight
  - tokens
  - static
  - global
  - keyframes

  > Note that this only works when passing an `--outfile`.

  You can use it like this:

  ```bash
  panda cssgen "static" --outfile dist/static.css
  ```

### Patch Changes

- Updated dependencies [20f4e204]
- Updated dependencies [36252b1d]
  - @pandacss/node@0.16.0
  - @pandacss/postcss@0.16.0
  - @pandacss/studio@0.16.0
  - @pandacss/config@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/preset-panda@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- Updated dependencies [909fcbe8]
  - @pandacss/node@0.15.5
  - @pandacss/postcss@0.15.5
  - @pandacss/studio@0.15.5
  - @pandacss/config@0.15.5
  - @pandacss/error@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/preset-panda@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
  - @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- Updated dependencies [abd7c47a]
- Updated dependencies [69699ba4]
  - @pandacss/config@0.15.4
  - @pandacss/studio@0.15.4
  - @pandacss/node@0.15.4
  - @pandacss/types@0.15.4
  - @pandacss/postcss@0.15.4
  - @pandacss/error@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/preset-panda@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
- Updated dependencies [1eb31118]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/studio@0.15.3
  - @pandacss/node@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/config@0.15.3
  - @pandacss/preset-panda@0.15.3
  - @pandacss/postcss@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- f3c30d60: Fix issue where studio uses studio config, instead of custom panda config.
- Updated dependencies [f3c30d60]
- Updated dependencies [26a788c0]
- Updated dependencies [f3c30d60]
- Updated dependencies [2645c2da]
  - @pandacss/node@0.15.2
  - @pandacss/studio@0.15.2
  - @pandacss/types@0.15.2
  - @pandacss/config@0.15.2
  - @pandacss/postcss@0.15.2
  - @pandacss/preset-panda@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- Updated dependencies [7e8bcb03]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/studio@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/node@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/postcss@0.15.1
  - @pandacss/config@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/logger@0.15.1
  - @pandacss/preset-panda@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/studio@0.15.0
  - @pandacss/node@0.15.0
  - @pandacss/config@0.15.0
  - @pandacss/preset-panda@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/postcss@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- 6552d715: Add missing types (PatternConfig, RecipeConfig, RecipeVariantRecord) to solve a TypeScript issue (The
  inferred type of xxx cannot be named without a reference...)
- Updated dependencies [b1c31fdd]
- Updated dependencies [bff17df2]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/studio@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/node@0.14.0
  - @pandacss/config@0.14.0
  - @pandacss/preset-panda@0.14.0
  - @pandacss/postcss@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- Updated dependencies [577dcb9d]
- Updated dependencies [d0fbc7cc]
  - @pandacss/studio@0.13.1
  - @pandacss/error@0.13.1
  - @pandacss/config@0.13.1
  - @pandacss/node@0.13.1
  - @pandacss/postcss@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/preset-panda@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/node@0.13.0
- @pandacss/studio@0.13.0
- @pandacss/postcss@0.13.0
- @pandacss/config@0.13.0
- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/preset-panda@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/node@0.12.2
- @pandacss/postcss@0.12.2
- @pandacss/studio@0.12.2
- @pandacss/config@0.12.2
- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/preset-panda@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/node@0.12.1
- @pandacss/postcss@0.12.1
- @pandacss/studio@0.12.1
- @pandacss/config@0.12.1
- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/preset-panda@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Minor Changes

- 75ba44de: Add the CLI interactive mode

### Patch Changes

- 7a041b16: Add `defineUtility` method
- 4c8c1715: Export types for all `define` helper functions
- Updated dependencies [4c8c1715]
- Updated dependencies [bf2ff391]
  - @pandacss/studio@0.12.0
  - @pandacss/node@0.12.0
  - @pandacss/config@0.12.0
  - @pandacss/postcss@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/error@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/preset-panda@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/studio@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/node@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/config@0.11.1
  - @pandacss/preset-panda@0.11.1
  - @pandacss/postcss@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- cde9702e: Add an optional `glob` argument that overrides the config.include on the `panda cssgen` CLI command.
- 164fbf27: Remove astro plugin entrypoint in favor of installing `@pandacss/astro` package
- Updated dependencies [dead08a2]
- Updated dependencies [cde9702e]
- Updated dependencies [5b95caf5]
  - @pandacss/config@0.11.0
  - @pandacss/node@0.11.0
  - @pandacss/types@0.11.0
  - @pandacss/studio@0.11.0
  - @pandacss/postcss@0.11.0
  - @pandacss/preset-panda@0.11.0
  - @pandacss/token-dictionary@0.11.0
  - @pandacss/error@0.11.0
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
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/studio@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/node@0.10.0
  - @pandacss/config@0.10.0
  - @pandacss/preset-panda@0.10.0
  - @pandacss/postcss@0.10.0
  - @pandacss/astro@0.10.0
  - @pandacss/error@0.10.0
  - @pandacss/logger@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
- Updated dependencies [f10e706a]
  - @pandacss/types@0.9.0
  - @pandacss/postcss@0.9.0
  - @pandacss/node@0.9.0
  - @pandacss/config@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/preset-panda@0.9.0
  - @pandacss/studio@0.9.0
  - @pandacss/astro@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- f7da0aea: Add `-w, --watch` flag on `panda cssgen`, `-o` shortcut for `--outfile` for both `panda cssgen` and
  `panda ship`
- Updated dependencies [5d1d376b]
- Updated dependencies [ac078416]
- Updated dependencies [e1f6318a]
- Updated dependencies [be0ad578]
- Updated dependencies [78612d7f]
  - @pandacss/node@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/config@0.8.0
  - @pandacss/studio@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/postcss@0.8.0
  - @pandacss/preset-panda@0.8.0
  - @pandacss/astro@0.8.0
  - @pandacss/error@0.8.0
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
  - @pandacss/postcss@0.7.0
  - @pandacss/studio@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/preset-panda@0.7.0
  - @pandacss/astro@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 21f1326b: Fix issue where `--config` flag doesn't work for most commands.
- Updated dependencies [032c152a]
- Updated dependencies [239fe41a]
- Updated dependencies [76419e3e]
  - @pandacss/node@0.6.0
  - @pandacss/studio@0.6.0
  - @pandacss/postcss@0.6.0
  - @pandacss/config@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/astro@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/preset-panda@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 5b09ab3b: Add support for `--outfile` flag in the `cssgen` command.

  ```bash
  panda cssgen --outfile dist/styles.css
  ```

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

- Updated dependencies [773565c4]
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
  - @pandacss/studio@0.5.1
  - @pandacss/node@0.5.1
  - @pandacss/types@0.5.1
  - @pandacss/config@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/postcss@0.5.1
  - @pandacss/preset-panda@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/astro@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
- Updated dependencies [3a87cff8]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/preset-panda@0.5.0
  - @pandacss/studio@0.5.0
  - @pandacss/node@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/config@0.5.0
  - @pandacss/postcss@0.5.0
  - @pandacss/astro@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- 8991b1e4: - Experimental support for `.vue` files and better `.svelte` support
  - Fix issue where the `panda ship` command does not write to the correct path
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [d00eb17c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/studio@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/config@0.4.0
  - @pandacss/node@0.4.0
  - @pandacss/preset-panda@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/postcss@0.4.0
  - @pandacss/astro@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- c8bee958: Add support for config path in cli commands via the `--config` or `-c` flag.

  ```bash
  panda init --config ./pandacss.config.js
  ```

- Updated dependencies [24b78f7c]
- Updated dependencies [9822d79a]
- Updated dependencies [65d3423f]
  - @pandacss/postcss@0.3.2
  - @pandacss/config@0.3.2
  - @pandacss/studio@0.3.2
  - @pandacss/astro@0.3.2
  - @pandacss/node@0.3.2
  - @pandacss/error@0.3.2
  - @pandacss/logger@0.3.2
  - @pandacss/preset-panda@0.3.2
  - @pandacss/shared@0.3.2
  - @pandacss/token-dictionary@0.3.2
  - @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
- Updated dependencies [22ec328e]
  - @pandacss/astro@0.3.1
  - @pandacss/config@0.3.1
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/node@0.3.1
  - @pandacss/postcss@0.3.1
  - @pandacss/preset-panda@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/studio@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [b8ab0868]
- Updated dependencies [bd5c049b]
- Updated dependencies [6d81ee9e]
  - @pandacss/node@0.3.0
  - @pandacss/preset-panda@0.3.0
  - @pandacss/types@0.3.0
  - @pandacss/postcss@0.3.0
  - @pandacss/studio@0.3.0
  - @pandacss/config@0.3.0
  - @pandacss/token-dictionary@0.3.0
  - @pandacss/astro@0.3.0
  - @pandacss/error@0.3.0
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
  - @pandacss/config@0.0.2
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/node@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
