# @pandacss/token-dictionary

## 0.38.0

### Minor Changes

- bc09d89: Add support for deprecating tokens, utilities, patterns and config recipes.

  Set the `deprecated` property to `true` to enable deprecation warnings. Alternatively, you can also set it to a string
  to provide a custom migration message.

  **Deprecating a utility**

  ```js
  defineConfig({
    utilities: {
      ta: {
        deprecated: true,
        transform(value) {
          return { textAlign: value };
        },
      },
    },
  });
  ```

  **Deprecating a token**

  ```js
  defineConfig({
    theme: {
      tokens: {
        spacing: {
          lg: { value: "8px", deprecated: "use `8` instead" },
        },
      },
    },
  });
  ```

  **Deprecating a pattern**

  ```js
  defineConfig({
    patterns: {
      customStack: {
        deprecated: true,
      },
    },
  });
  ```

  **Deprecating a recipe**

  ```js
  defineConfig({
    theme: {
      recipes: {
        btn: {
          deprecated: "will be removed in v2.0",
        },
      },
    },
  });
  ```

  ### ESLint Plugin

  These deprecation warnings will translated into the ESLint plugin as a `no-deprecated` rule.

  ```json
  {
    "rules": {
      "no-deprecated": "warn"
    }
  }
  ```

  In the next release of the ESLint plugin, you will get a warning when using deprecated tokens or utilities.

### Patch Changes

- Updated dependencies [96b47b3]
- Updated dependencies [bc09d89]
- Updated dependencies [2c8b933]
  - @pandacss/types@0.38.0
  - @pandacss/shared@0.38.0
  - @pandacss/logger@0.38.0

## 0.37.2

### Patch Changes

- Updated dependencies [74dfb3e]
  - @pandacss/types@0.37.2
  - @pandacss/logger@0.37.2
  - @pandacss/shared@0.37.2

## 0.37.1

### Patch Changes

- 93dc9f5: Public changes: Some quality of life fixes for the Studio:

  - Handle displaying values using the `[xxx]` escape-hatch syntax for `textStyles` in the studio
  - Display an empty state when there's no token in a specific token page in the studio

  ***

  (mostly) Internal changes:

  - Add `deepResolveReference` in TokenDictionary, helpful to get the raw value from a semantic token by recursively
    traversing the token references.
  - Added some exports in the `@pandacss/token-dictionary` package, mostly useful when building tooling around Panda
    (Prettier/ESLint/VSCode plugin etc)

- Updated dependencies [885963c]
- Updated dependencies [99870bb]
  - @pandacss/types@0.37.1
  - @pandacss/shared@0.37.1
  - @pandacss/logger@0.37.1

## 0.37.0

### Patch Changes

- Updated dependencies [7daf159]
- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/shared@0.37.0
  - @pandacss/types@0.37.0
  - @pandacss/logger@0.37.0

## 0.36.1

### Patch Changes

- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1
  - @pandacss/logger@0.36.1
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

- 3af3940: Fix an issue when using a semantic token with one (but not all) condition using the color opacity modifier

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    theme: {
      extend: {
        tokens: {
          colors: {
            black: { value: "black" },
            white: { value: "white" },
          },
        },
        semanticTokens: {
          colors: {
            fg: {
              value: {
                base: "{colors.black/87}",
                _dark: "{colors.white}", // <- this was causing a weird issue
              },
            },
          },
        },
      },
    },
  });
  ```

- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/types@0.36.0
  - @pandacss/logger@0.36.0
  - @pandacss/shared@0.36.0

## 0.35.0

### Patch Changes

- f2fdc48: Fix negative `semanticTokens` generation

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    tokens: {
      spacing: {
        1: { value: "1rem" },
      },
    },
    semanticTokens: {
      spacing: {
        lg: { value: "{spacing.1}" },
      },
    },
  });
  ```

  Will now correctly generate the negative value:

  ```diff
  "spacing.-1" => "calc(var(--spacing-1) * -1)",
  - "spacing.-lg" => "{spacing.1}",
  + "spacing.-lg" => "calc(var(--spacing-lg) * -1)",
  ```

- Updated dependencies [50db354]
- Updated dependencies [f6befbf]
- Updated dependencies [a0c4d27]
  - @pandacss/types@0.35.0
  - @pandacss/logger@0.35.0
  - @pandacss/shared@0.35.0

## 0.34.3

### Patch Changes

- @pandacss/logger@0.34.3
- @pandacss/shared@0.34.3
- @pandacss/types@0.34.3

## 0.34.2

### Patch Changes

- @pandacss/types@0.34.2
- @pandacss/logger@0.34.2
- @pandacss/shared@0.34.2

## 0.34.1

### Patch Changes

- d4942e0: Fix the color opacity modifier syntax for `semanticTokens` inside of conditions

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    conditions: {
      light: ".light &",
      dark: ".dark &",
    },
    theme: {
      tokens: {
        colors: {
          blue: { 500: { value: "blue" } },
          green: { 500: { value: "green" } },
        },
        opacity: {
          half: { value: 0.5 },
        },
      },
      semanticTokens: {
        colors: {
          secondary: {
            value: {
              base: "red",
              _light: "{colors.blue.500/32}", // <-- wasn't working as expected
              _dark: "{colors.green.500/half}",
            },
          },
        },
      },
    },
  });
  ```

  will now correctly generate the following CSS:

  ```css
  @layer tokens {
    :where(:root, :host) {
      --colors-blue-500: blue;
      --colors-green-500: green;
      --opacity-half: 0.5;
      --colors-secondary: red;
    }

    .light {
      --colors-secondary: color-mix(
        in srgb,
        var(--colors-blue-500) 32%,
        transparent
      );
    }

    .dark {
      --colors-secondary: color-mix(
        in srgb,
        var(--colors-green-500) 50%,
        transparent
      );
    }
  }
  ```

  - @pandacss/logger@0.34.1
  - @pandacss/shared@0.34.1
  - @pandacss/types@0.34.1

## 0.34.0

### Patch Changes

- 64d5144: Allow using the color opacity modifier syntax (`blue.300/70`) in token references:

  - `{colors.blue.300/70}`
  - `token(colors.blue.300/70)`

  Note that this works both in style usage and in build-time config.

  ```ts
  // runtime usage

  import { css } from "../styled-system/css";

  css({ bg: "{colors.blue.300/70}" });
  // => @layer utilities {
  //    .bg_token\(colors\.blue\.300\/70\) {
  //      background: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
  //    }
  //  }

  css({ bg: "token(colors.blue.300/70)" });
  // => @layer utilities {
  //    .bg_token\(colors\.blue\.300\/70\) {
  //      background: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
  //    }
  //  }
  ```

  ```ts
  // build-time usage
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    theme: {
      tokens: {
        colors: {
          blue: {
            300: { value: "#00f" },
          },
        },
      },
      semanticTokens: {
        colors: {
          primary: {
            value: "{colors.blue.300/70}",
          },
        },
      },
    },
  });
  ```

  ```css
  @layer tokens {
    :where(:root, :host) {
      --colors-blue-300: #00f;
      --colors-primary: color-mix(
        in srgb,
        var(--colors-blue-300) 70%,
        transparent
      );
    }
  }
  ```

- Updated dependencies [d1516c8]
  - @pandacss/types@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/shared@0.34.0

## 0.33.0

### Patch Changes

- 34d94cf: Unify the token path syntax when using `formatTokenName`

  Example with the following config:

  ```ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    hooks: {
      'tokens:created': ({ configure }) => {
        configure({
          formatTokenName: (path: string[]) => '
  ```

## 0.32.1

### Patch Changes

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

- 6d8c884: Fix issue where svg asset tokens doesn't work as expected due to unbalanced quotes.
- Updated dependencies [a032375]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/logger@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/logger@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/logger@0.30.1
- @pandacss/shared@0.30.1
- @pandacss/types@0.30.1

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

### Patch Changes

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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

## 0.28.0

### Patch Changes

- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/shared@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
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
- Updated dependencies [74ac0d9d]
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/shared@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/shared@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0

## 0.25.0

### Minor Changes

- de282f60: Support token reference syntax when authoring styles object, text styles and layer styles.

  ```jsx
  import { css } from "../styled-system/css";

  const styles = css({
    border: "2px solid {colors.primary}",
  });
  ```

  This will resolve the token reference and convert it to css variables.

  ```css
  .border_2px_solid_\{colors\.primary\} {
    border: 2px solid var(--colors-primary);
  }
  ```

  The alternative to this was to use the `token(...)` css function which will be resolved.

  ### `token(...)` vs `{...}`

  Both approaches return the css variable

  ```jsx
  const styles = css({
    // token reference syntax
    border: "2px solid {colors.primary}",
    // token function syntax
    border: "2px solid token(colors.primary)",
  });
  ```

  However, The `token(...)` syntax allows you to set a fallback value.

  ```jsx
  const styles = css({
    border: "2px solid token(colors.primary, red)",
  });
  ```

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/shared@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- @pandacss/shared@0.23.0
- @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/shared@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 566fd28a: Fix issue where virtual color does not apply DEFAULT color in palette
- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/types@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/shared@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/shared@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- @pandacss/shared@0.16.0
- @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/shared@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/shared@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 4e003bfb: - reuse css variable in semantic token alias
- Updated dependencies [26f6982c]
  - @pandacss/shared@0.15.1
  - @pandacss/types@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0

## 0.14.0

### Minor Changes

- b1c31fdd: - Introduces deep nested `colorPalettes` for enhanced color management

  - Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
    improved organization

  **Example**: Define colors within categories, variants and states

  ```js
  const theme = {
    extend: {
      semanticTokens: {
        colors: {
          button: {
            dark: {
              value: "navy",
            },
            light: {
              DEFAULT: {
                value: "skyblue",
              },
              accent: {
                DEFAULT: {
                  value: "cyan",
                },
                secondary: {
                  value: "blue",
                },
              },
            },
          },
        },
      },
    },
  };
  ```

  You can now use the root `button` color palette and its values directly:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button",
          color: "colorPalette.light",
          backgroundColor: "colorPalette.dark",
          _hover: {
            color: "colorPalette.light.accent",
            background: "colorPalette.light.accent.secondary",
          },
        })}
      >
        Root color palette
      </button>
    );
  };
  ```

  Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button.light.accent",
          color: "colorPalette.secondary",
        })}
      >
        Nested color palette leaf
      </button>
    );
  };
  ```

### Patch Changes

- 9e799554: Fix issue where negative spacing tokens doesn't respect hash option
- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/shared@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/shared@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/shared@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/shared@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Patch Changes

- 9d4aa918: Fix issue where svg asset tokens are seen as invalid in the browser
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0

## 0.6.0

### Patch Changes

- @pandacss/types@0.6.0
- @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/shared@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/shared@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
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
  - @pandacss/shared@0.0.2

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

- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [49c760cd]
- Updated dependencies [d5977c24]
  - @pandacss/types@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/logger@0.30.0

## 0.29.1

### Patch Changes

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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

## 0.28.0

### Patch Changes

- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/shared@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
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
- Updated dependencies [74ac0d9d]
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/shared@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/shared@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0

## 0.25.0

### Minor Changes

- de282f60: Support token reference syntax when authoring styles object, text styles and layer styles.

  ```jsx
  import { css } from "../styled-system/css";

  const styles = css({
    border: "2px solid {colors.primary}",
  });
  ```

  This will resolve the token reference and convert it to css variables.

  ```css
  .border_2px_solid_\{colors\.primary\} {
    border: 2px solid var(--colors-primary);
  }
  ```

  The alternative to this was to use the `token(...)` css function which will be resolved.

  ### `token(...)` vs `{...}`

  Both approaches return the css variable

  ```jsx
  const styles = css({
    // token reference syntax
    border: "2px solid {colors.primary}",
    // token function syntax
    border: "2px solid token(colors.primary)",
  });
  ```

  However, The `token(...)` syntax allows you to set a fallback value.

  ```jsx
  const styles = css({
    border: "2px solid token(colors.primary, red)",
  });
  ```

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/shared@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- @pandacss/shared@0.23.0
- @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/shared@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 566fd28a: Fix issue where virtual color does not apply DEFAULT color in palette
- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/types@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/shared@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/shared@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- @pandacss/shared@0.16.0
- @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/shared@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/shared@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 4e003bfb: - reuse css variable in semantic token alias
- Updated dependencies [26f6982c]
  - @pandacss/shared@0.15.1
  - @pandacss/types@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0

## 0.14.0

### Minor Changes

- b1c31fdd: - Introduces deep nested `colorPalettes` for enhanced color management

  - Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
    improved organization

  **Example**: Define colors within categories, variants and states

  ```js
  const theme = {
    extend: {
      semanticTokens: {
        colors: {
          button: {
            dark: {
              value: "navy",
            },
            light: {
              DEFAULT: {
                value: "skyblue",
              },
              accent: {
                DEFAULT: {
                  value: "cyan",
                },
                secondary: {
                  value: "blue",
                },
              },
            },
          },
        },
      },
    },
  };
  ```

  You can now use the root `button` color palette and its values directly:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button",
          color: "colorPalette.light",
          backgroundColor: "colorPalette.dark",
          _hover: {
            color: "colorPalette.light.accent",
            background: "colorPalette.light.accent.secondary",
          },
        })}
      >
        Root color palette
      </button>
    );
  };
  ```

  Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button.light.accent",
          color: "colorPalette.secondary",
        })}
      >
        Nested color palette leaf
      </button>
    );
  };
  ```

### Patch Changes

- 9e799554: Fix issue where negative spacing tokens doesn't respect hash option
- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/shared@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/shared@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/shared@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/shared@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Patch Changes

- 9d4aa918: Fix issue where svg asset tokens are seen as invalid in the browser
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0

## 0.6.0

### Patch Changes

- @pandacss/types@0.6.0
- @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/shared@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/shared@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
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
  - @pandacss/shared@0.0.2

* path.join('-'), }) }, }, })

````

Will now allow you to use the following syntax for token path:

```diff
- css({ boxShadow: '10px 10px 10px {colors.$primary}' })
+ css({ boxShadow: '10px 10px 10px {$colors-primary}' })

- token.var('colors.$primary')
+ token.var('$colors-black')
````

- e855c64: Fix svg token asset quotes
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/types@0.33.0
  - @pandacss/logger@0.33.0
  - @pandacss/shared@0.33.0

## 0.32.1

### Patch Changes

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

- 6d8c884: Fix issue where svg asset tokens doesn't work as expected due to unbalanced quotes.
- Updated dependencies [a032375]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/logger@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/logger@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/logger@0.30.1
- @pandacss/shared@0.30.1
- @pandacss/types@0.30.1

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

### Patch Changes

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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

## 0.28.0

### Patch Changes

- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/shared@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
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
- Updated dependencies [74ac0d9d]
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/shared@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/shared@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0

## 0.25.0

### Minor Changes

- de282f60: Support token reference syntax when authoring styles object, text styles and layer styles.

  ```jsx
  import { css } from "../styled-system/css";

  const styles = css({
    border: "2px solid {colors.primary}",
  });
  ```

  This will resolve the token reference and convert it to css variables.

  ```css
  .border_2px_solid_\{colors\.primary\} {
    border: 2px solid var(--colors-primary);
  }
  ```

  The alternative to this was to use the `token(...)` css function which will be resolved.

  ### `token(...)` vs `{...}`

  Both approaches return the css variable

  ```jsx
  const styles = css({
    // token reference syntax
    border: "2px solid {colors.primary}",
    // token function syntax
    border: "2px solid token(colors.primary)",
  });
  ```

  However, The `token(...)` syntax allows you to set a fallback value.

  ```jsx
  const styles = css({
    border: "2px solid token(colors.primary, red)",
  });
  ```

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/shared@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- @pandacss/shared@0.23.0
- @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/shared@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 566fd28a: Fix issue where virtual color does not apply DEFAULT color in palette
- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/types@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/shared@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/shared@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- @pandacss/shared@0.16.0
- @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/shared@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/shared@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 4e003bfb: - reuse css variable in semantic token alias
- Updated dependencies [26f6982c]
  - @pandacss/shared@0.15.1
  - @pandacss/types@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0

## 0.14.0

### Minor Changes

- b1c31fdd: - Introduces deep nested `colorPalettes` for enhanced color management

  - Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
    improved organization

  **Example**: Define colors within categories, variants and states

  ```js
  const theme = {
    extend: {
      semanticTokens: {
        colors: {
          button: {
            dark: {
              value: "navy",
            },
            light: {
              DEFAULT: {
                value: "skyblue",
              },
              accent: {
                DEFAULT: {
                  value: "cyan",
                },
                secondary: {
                  value: "blue",
                },
              },
            },
          },
        },
      },
    },
  };
  ```

  You can now use the root `button` color palette and its values directly:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button",
          color: "colorPalette.light",
          backgroundColor: "colorPalette.dark",
          _hover: {
            color: "colorPalette.light.accent",
            background: "colorPalette.light.accent.secondary",
          },
        })}
      >
        Root color palette
      </button>
    );
  };
  ```

  Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button.light.accent",
          color: "colorPalette.secondary",
        })}
      >
        Nested color palette leaf
      </button>
    );
  };
  ```

### Patch Changes

- 9e799554: Fix issue where negative spacing tokens doesn't respect hash option
- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/shared@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/shared@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/shared@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/shared@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Patch Changes

- 9d4aa918: Fix issue where svg asset tokens are seen as invalid in the browser
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0

## 0.6.0

### Patch Changes

- @pandacss/types@0.6.0
- @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/shared@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/shared@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
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
  - @pandacss/shared@0.0.2

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

- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [49c760cd]
- Updated dependencies [d5977c24]
  - @pandacss/types@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/logger@0.30.0

## 0.29.1

### Patch Changes

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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/logger@0.29.0
  - @pandacss/shared@0.29.0

## 0.28.0

### Patch Changes

- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/shared@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
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
- Updated dependencies [74ac0d9d]
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/shared@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/shared@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0

## 0.25.0

### Minor Changes

- de282f60: Support token reference syntax when authoring styles object, text styles and layer styles.

  ```jsx
  import { css } from "../styled-system/css";

  const styles = css({
    border: "2px solid {colors.primary}",
  });
  ```

  This will resolve the token reference and convert it to css variables.

  ```css
  .border_2px_solid_\{colors\.primary\} {
    border: 2px solid var(--colors-primary);
  }
  ```

  The alternative to this was to use the `token(...)` css function which will be resolved.

  ### `token(...)` vs `{...}`

  Both approaches return the css variable

  ```jsx
  const styles = css({
    // token reference syntax
    border: "2px solid {colors.primary}",
    // token function syntax
    border: "2px solid token(colors.primary)",
  });
  ```

  However, The `token(...)` syntax allows you to set a fallback value.

  ```jsx
  const styles = css({
    border: "2px solid token(colors.primary, red)",
  });
  ```

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/shared@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- @pandacss/shared@0.23.0
- @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/shared@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 566fd28a: Fix issue where virtual color does not apply DEFAULT color in palette
- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/types@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/shared@0.17.5
- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/shared@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- @pandacss/shared@0.16.0
- @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/shared@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/shared@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 4e003bfb: - reuse css variable in semantic token alias
- Updated dependencies [26f6982c]
  - @pandacss/shared@0.15.1
  - @pandacss/types@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0

## 0.14.0

### Minor Changes

- b1c31fdd: - Introduces deep nested `colorPalettes` for enhanced color management

  - Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
    improved organization

  **Example**: Define colors within categories, variants and states

  ```js
  const theme = {
    extend: {
      semanticTokens: {
        colors: {
          button: {
            dark: {
              value: "navy",
            },
            light: {
              DEFAULT: {
                value: "skyblue",
              },
              accent: {
                DEFAULT: {
                  value: "cyan",
                },
                secondary: {
                  value: "blue",
                },
              },
            },
          },
        },
      },
    },
  };
  ```

  You can now use the root `button` color palette and its values directly:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button",
          color: "colorPalette.light",
          backgroundColor: "colorPalette.dark",
          _hover: {
            color: "colorPalette.light.accent",
            background: "colorPalette.light.accent.secondary",
          },
        })}
      >
        Root color palette
      </button>
    );
  };
  ```

  Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

  ```tsx
  import { css } from "../styled-system/css";

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: "button.light.accent",
          color: "colorPalette.secondary",
        })}
      >
        Nested color palette leaf
      </button>
    );
  };
  ```

### Patch Changes

- 9e799554: Fix issue where negative spacing tokens doesn't respect hash option
- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/shared@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/shared@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/shared@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/shared@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Patch Changes

- 9d4aa918: Fix issue where svg asset tokens are seen as invalid in the browser
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0

## 0.6.0

### Patch Changes

- @pandacss/types@0.6.0
- @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/shared@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/shared@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
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
  - @pandacss/shared@0.0.2
