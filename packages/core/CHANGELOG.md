# @pandacss/core

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

- 2c8b933: Add least resource used (LRU) cache in the hot parts to prevent memory from growing infinitely

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
- Updated dependencies [2c8b933]
  - @pandacss/types@0.38.0
  - @pandacss/token-dictionary@0.38.0
  - @pandacss/shared@0.38.0
  - @pandacss/logger@0.38.0
  - @pandacss/is-valid-prop@0.38.0

## 0.37.2

### Patch Changes

- Updated dependencies [74dfb3e]
  - @pandacss/types@0.37.2
  - @pandacss/logger@0.37.2
  - @pandacss/token-dictionary@0.37.2
  - @pandacss/is-valid-prop@0.37.2
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

- Updated dependencies [93dc9f5]
- Updated dependencies [885963c]
- Updated dependencies [99870bb]
  - @pandacss/token-dictionary@0.37.1
  - @pandacss/types@0.37.1
  - @pandacss/shared@0.37.1
  - @pandacss/logger@0.37.1
  - @pandacss/is-valid-prop@0.37.1

## 0.37.0

### Minor Changes

- bcfb5c5: ### Fixed

  - Fix className collisions between utilities by using unique class names per property in the default preset.

  ### Changed

  - **Color Mode Selectors**: Changed the default selectors for `_light` and `_dark` to target parent elements. This
    ensures consistent behavior with using these conditions to style pseudo elements (like `::before` and `::after`).

  ```diff
  const conditions = {
  -  _dark: '&.dark, .dark &',
  +  _dark: '.dark &',
  -  _light: '&.light, .light &',
  +  _light: '.light &',
  }
  ```

  - Changed `divideX` and `divideY` now maps to the `borderWidths` token group.

  ### Added

  - **Spacing Utilities**: Add new `spaceX` and `spaceY` utilities for applying margin between elements. Especially
    useful when applying negative margin to child elements.

  ```tsx
  <div className={flex({ spaceX: "-1" })}>
    <div className={circle({ size: "5", bg: "red" })} />
    <div className={circle({ size: "5", bg: "pink" })} />
  </div>
  ```

  - Added new `_starting` condition to support the new `@starting-style` at-rule.
    [Learn more here](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
  - **Gradient Position**: Add new `gradientFromPosition` and `gradientToPosition` utilities for controlling the
    position of the gradient color stops.

  ```tsx
  <div
    className={css({
      bgGradient: "to-r",
      // from
      gradientFrom: "red",
      gradientFromPosition: "top left",
      // to
      gradientTo: "blue",
      gradientToPosition: "bottom right",
    })}
  />
  ```

- 6247dfb: Allow multiple `importMap` (or multiple single import entrypoints if using the object format).

  It can be useful to use a component library's `styled-system` while also using your own `styled-system` in your app.

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    importMap: [
      "@acme/styled-system",
      "@ui-lib/styled-system",
      "styled-system",
    ],
  });
  ```

  Now you can use any of the `@acme/styled-system`, `@ui-lib/styled-system` and `styled-system` import sources:

  ```ts
  import { css } from "@acme/css";
  import { css as uiCss } from "@ui-lib/styled-system/css";
  import { css as appCss } from "@ui-lib/styled-system/css";
  ```

### Patch Changes

- Updated dependencies [7daf159]
- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/shared@0.37.0
  - @pandacss/types@0.37.0
  - @pandacss/token-dictionary@0.37.0
  - @pandacss/logger@0.37.0
  - @pandacss/is-valid-prop@0.37.0

## 0.36.1

### Patch Changes

- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1
  - @pandacss/logger@0.36.1
  - @pandacss/token-dictionary@0.36.1
  - @pandacss/is-valid-prop@0.36.1
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

- fabdabe: ## Changes

  When using `strictTokens: true`, if you didn't have `tokens` (or `semanticTokens`) on a given `Token category`, you'd
  still not be able to use _any_ values in properties bound to that category. Now, `strictTokens` will correctly only
  restrict properties that have values in their token category.

  Example:

  ```ts
  // panda.config.ts

  export default defineConfig({
    // ...
    strictTokens: true,
    theme: {
      extend: {
        colors: {
          primary: { value: "blue" },
        },
        // borderWidths: {}, // ⚠️ nothing defined here
      },
    },
  });
  ```

  ```ts
  // app.tsx
  css({
    // ❌ before this PR, TS would throw an error as you are supposed to only use Tokens
    // even thought you don't have any `borderWidths` tokens defined !

    // ✅ after this PR, TS will not throw an error anymore as you don't have any `borderWidths` tokens
    // if you add one, this will error again (as it's supposed to)
    borderWidths: "123px",
  });
  ```

  ## Description

  - Simplify typings for the style properties.
  - Add the `csstype` comments for each property.

  You will now be able to see a utility or `csstype` values in 2 clicks !

  ## How

  Instead of relying on TS to infer the correct type for each properties, we now just generate the appropriate value for
  each property based on the config.

  This should make it easier to understand the type of each property and might also speed up the TS suggestions as
  there's less to infer.

### Patch Changes

- Updated dependencies [3af3940]
- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/token-dictionary@0.36.0
  - @pandacss/types@0.36.0
  - @pandacss/is-valid-prop@0.36.0
  - @pandacss/logger@0.36.0
  - @pandacss/shared@0.36.0

## 0.35.0

### Patch Changes

- c459b43: Fix extraction of JSX `styled` factory when using namespace imports

  ```tsx
  import * as pandaJsx from "../styled-system/jsx";

  // ✅ this will work now
  pandaJsx.styled("div", { base: { color: "red" } });
  const App = () => (
    <pandaJsx.styled.span color="blue">Hello</pandaJsx.styled.span>
  );
  ```

- Updated dependencies [f2fdc48]
- Updated dependencies [50db354]
- Updated dependencies [f6befbf]
- Updated dependencies [a0c4d27]
  - @pandacss/token-dictionary@0.35.0
  - @pandacss/types@0.35.0
  - @pandacss/logger@0.35.0
  - @pandacss/is-valid-prop@0.35.0
  - @pandacss/shared@0.35.0

## 0.34.3

### Patch Changes

- @pandacss/is-valid-prop@0.34.3
- @pandacss/logger@0.34.3
- @pandacss/shared@0.34.3
- @pandacss/token-dictionary@0.34.3
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

  - @pandacss/types@0.34.2
  - @pandacss/is-valid-prop@0.34.2
  - @pandacss/logger@0.34.2
  - @pandacss/shared@0.34.2
  - @pandacss/token-dictionary@0.34.2

## 0.34.1

### Patch Changes

- Updated dependencies [d4942e0]
  - @pandacss/token-dictionary@0.34.1
  - @pandacss/is-valid-prop@0.34.1
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

- Updated dependencies [64d5144]
- Updated dependencies [d1516c8]
  - @pandacss/token-dictionary@0.34.0
  - @pandacss/types@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/is-valid-prop@0.34.0
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

- f419993: - Prevent extracting style props of `styled` when not explicitly imported

  - Allow using multiple aliases for the same identifier for the `/css` entrypoints just like `/patterns` and `/recipes`

  ```ts
  import { css } from "../styled-system/css";
  import { css as css2 } from "../styled-system/css";

  css({ display: "flex" });
  css2({ flexDirection: "column" }); // this wasn't working before, now it does
  ```

- Updated dependencies [a032375]
- Updated dependencies [5184771]
- Updated dependencies [6d8c884]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/token-dictionary@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/is-valid-prop@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Minor Changes

- b32d817: Switch from `em` to `rem` for breakpoints and container queries to prevent side effects.

### Patch Changes

- 433a364: Automatically generate a recipe `compoundVariants` when using `staticCss`
- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/token-dictionary@0.32.0
  - @pandacss/logger@0.32.0
  - @pandacss/is-valid-prop@0.32.0

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

- a17fe387: - Add a `config.polyfill` option that will polyfill the CSS @layer at-rules using a
  [postcss plugin](https://www.npmjs.com/package/@csstools/postcss-cascade-layers)
  - And `--polyfill` flag to `panda` and `panda cssgen` commands

### Patch Changes

- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/token-dictionary@0.31.0
  - @pandacss/is-valid-prop@0.31.0

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
  - @pandacss/logger@0.30.2
  - @pandacss/token-dictionary@0.30.2
  - @pandacss/is-valid-prop@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/is-valid-prop@0.30.1
- @pandacss/logger@0.30.1
- @pandacss/shared@0.30.1
- @pandacss/token-dictionary@0.30.1
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

- a5c75607: Fix an issue (introduced in v0.29) with `panda init` and add an assert on the new `colorMix` utility
  function
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
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

- f778d3e5: You can now set and override `defaultValues` in pattern configurations.

  Here's an example of how to define a new `hstack` pattern with a default `gap` value of `40px`:

  ```js
  defineConfig({
    patterns: {
      hstack: {
        properties: {
          justify: { type: "property", value: "justifyContent" },
          gap: { type: "property", value: "gap" },
        },
        // you can also use a token like '10'
        defaultValues: { gap: "40px" },
        transform(props) {
          const { justify, gap, ...rest } = props;
          return {
            display: "flex",
            alignItems: "center",
            justifyContent: justify,
            gap,
            ...rest,
          };
        },
      },
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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/is-valid-prop@0.29.0
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

- e463ce0e: Fix the issue in the utility configuration where shorthand without `className` returns incorrect CSS when
  using the shorthand version.

  ```js
  utilities: {
    extend: {
      coloredBorder: {
        shorthand: 'cb', // no classname, returns incorrect css
        values: ['red', 'green', 'blue'],
        transform(value) {
          return {
            border: `1px solid ${value}`,
          };
        },
      },
    },
  },
  ```

- 77cab9fe: Fix a regression with globalCss selector order

  ```ts
  {
      globalCss: {
          html: {
            ".aaa": {
              color: "red.100",
              "& .bbb": {
                color: "red.200",
                "& .ccc": {
                  color: "red.300"
                }
              }
            }
          },
      }
  }
  ```

  would incorrectly generate (regression introduced in v0.26.2)

  ```css
  .aaa html {
    color: var(--colors-red-100);
  }

  .aaa html .bbb {
    color: var(--colors-red-200);
  }

  .aaa html .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

  will now correctly generate again:

  ```css
  html .aaa {
    color: var(--colors-red-100);
  }

  html .aaa .bbb {
    color: var(--colors-red-200);
  }

  html .aaa .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

- 9d000dcd: Fix a regression with rule insertion order after triggering HMR that re-uses some CSS already generated in
  previous triggers, introuced in v0.27.0
- 6d7e7b07: Slight perf improvement by caching a few computed properties that contains a loop
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/error@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- 1ed4df77: Fix issue where HMR doesn't work when tsconfig paths is used.
- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/error@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/error@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/token-dictionary@0.27.1
  - @pandacss/error@0.27.1
  - @pandacss/is-valid-prop@0.27.1
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
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/error@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/error@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/error@0.26.1
- @pandacss/is-valid-prop@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- 14033e00: Display better CssSyntaxError logs
- d420c676: Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in
  ESLint Plugin and Node.js.
- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/error@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

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

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- de282f60: Fix issue where `base` doesn't work within css function

  ```jsx
  css({
    // This didn't work, but now it does
    base: { color: "blue" },
  });
  ```

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/error@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value
- 61ebf3d2: Fix issue where config slot recipes with compound variants were not processed correctly
- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/error@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/error@0.24.1
- @pandacss/is-valid-prop@0.24.1
- @pandacss/logger@0.24.1
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
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/error@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- 1ea7459c: Fix performance issue where process could get slower due to postcss rules held in memory.
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

- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/error@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- 11753fea: Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/logger@0.22.0

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

### Patch Changes

- 788aaba3: Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains
  an URL.

  ```tsx
  const App = () => {
    // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
    // but since it's an URL, it would produce invalid CSS
    // we now check if the property value is an URL and skip it if needed
    return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />;
  };
  ```

- d81dcbe6: - Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the
  normalization that happens internally.
  - Fix issue where Preact JSX types are not merging recipes correctly
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

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/token-dictionary@0.20.1
- @pandacss/error@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- 4ba982f3: Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

  ```ts
  css({
    "@container (min-width: token(sizes.xl))": {
      color: "green.300",
    },
    "@media (min-width: token(sizes.2xl))": {
      color: "red.300",
    },
  });
  ```

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 9f5711f9: Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache
  not being cleared as needed.
- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/error@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/shared@0.18.3
- @pandacss/token-dictionary@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/token-dictionary@0.18.2
- @pandacss/error@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 8c76cd0f: - Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints

  ```jsx
  css({ hideBelow: "lg" });
  // => @media screen and (max-width: 63.9975em) { background: red; }
  ```

  - Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

  ```jsx
  css({ hideFrom: "800px" });
  // => @media screen and (min-width: 800px) { background: red; }
  ```

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- a6dfc944: Fix issue where using array syntax in config recipe generates invalid css
  - @pandacss/error@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/error@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- aea28c9f: Fix issue where using scale css property adds an additional 'px'
- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- e73ea803: Automatically add each recipe slots to the `jsx` property, with a dot notation

  ```ts
  const button = defineSlotRecipe({
    className: "button",
    slots: ["root", "icon", "label"],
    // ...
  });
  ```

  will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- 20f4e204: Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/error@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/shared@0.15.5
- @pandacss/token-dictionary@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/error@0.15.4
- @pandacss/logger@0.15.4
- @pandacss/shared@0.15.4
- @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work
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
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 848936e0: Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

  ```js
  import { css } from "../styled-system/css";

  const className = css({
    "@media screen and (min-width: token(sizes.4xl))": {
      color: "green.400",
    },
  });
  ```

- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Minor Changes

- bc3b077d: Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher
  specificity

### Patch Changes

- dd47b6e6: Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- e6459a59: The utility transform fn now allow retrieving the token object with the raw value/conditions as currently
  there's no way to get it from there.
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 02161d41: Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token
  were left unchanged (due to the `.`)

  Before:

  ```css
  * {
    color: token(colors.magenta, pink);
  }
  ```

  Now:

  ```css
  * {
    color: token("colors.magenta", pink);
  }
  ```

- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [d0fbc7cc]
  - @pandacss/error@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/token-dictionary@0.12.0
- @pandacss/error@0.12.0
- @pandacss/logger@0.12.0
- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
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

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/error@0.10.0
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
  - @pandacss/types@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

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

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 12c900ee: Fix issue where unitless grid properties were converted to pixel values
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

- ef1dd676: Fix issue where `staticCss` did not generate all variants in the array of `css` rules
- b50675ca: Refactor parser to support extracting `css` prop in JSX elements correctly.
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

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

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

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

- 2a1e9386: Fix issue where aspect ratio css property adds `px`
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/error@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2

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
  - @pandacss/token-dictionary@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/is-valid-prop@0.30.0

## 0.29.1

### Patch Changes

- a5c75607: Fix an issue (introduced in v0.29) with `panda init` and add an assert on the new `colorMix` utility
  function
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
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

- f778d3e5: You can now set and override `defaultValues` in pattern configurations.

  Here's an example of how to define a new `hstack` pattern with a default `gap` value of `40px`:

  ```js
  defineConfig({
    patterns: {
      hstack: {
        properties: {
          justify: { type: "property", value: "justifyContent" },
          gap: { type: "property", value: "gap" },
        },
        // you can also use a token like '10'
        defaultValues: { gap: "40px" },
        transform(props) {
          const { justify, gap, ...rest } = props;
          return {
            display: "flex",
            alignItems: "center",
            justifyContent: justify,
            gap,
            ...rest,
          };
        },
      },
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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/is-valid-prop@0.29.0
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

- e463ce0e: Fix the issue in the utility configuration where shorthand without `className` returns incorrect CSS when
  using the shorthand version.

  ```js
  utilities: {
    extend: {
      coloredBorder: {
        shorthand: 'cb', // no classname, returns incorrect css
        values: ['red', 'green', 'blue'],
        transform(value) {
          return {
            border: `1px solid ${value}`,
          };
        },
      },
    },
  },
  ```

- 77cab9fe: Fix a regression with globalCss selector order

  ```ts
  {
      globalCss: {
          html: {
            ".aaa": {
              color: "red.100",
              "& .bbb": {
                color: "red.200",
                "& .ccc": {
                  color: "red.300"
                }
              }
            }
          },
      }
  }
  ```

  would incorrectly generate (regression introduced in v0.26.2)

  ```css
  .aaa html {
    color: var(--colors-red-100);
  }

  .aaa html .bbb {
    color: var(--colors-red-200);
  }

  .aaa html .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

  will now correctly generate again:

  ```css
  html .aaa {
    color: var(--colors-red-100);
  }

  html .aaa .bbb {
    color: var(--colors-red-200);
  }

  html .aaa .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

- 9d000dcd: Fix a regression with rule insertion order after triggering HMR that re-uses some CSS already generated in
  previous triggers, introuced in v0.27.0
- 6d7e7b07: Slight perf improvement by caching a few computed properties that contains a loop
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/error@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- 1ed4df77: Fix issue where HMR doesn't work when tsconfig paths is used.
- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/error@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/error@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/token-dictionary@0.27.1
  - @pandacss/error@0.27.1
  - @pandacss/is-valid-prop@0.27.1
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
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/error@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/error@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/error@0.26.1
- @pandacss/is-valid-prop@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- 14033e00: Display better CssSyntaxError logs
- d420c676: Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in
  ESLint Plugin and Node.js.
- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/error@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

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

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- de282f60: Fix issue where `base` doesn't work within css function

  ```jsx
  css({
    // This didn't work, but now it does
    base: { color: "blue" },
  });
  ```

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/error@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value
- 61ebf3d2: Fix issue where config slot recipes with compound variants were not processed correctly
- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/error@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/error@0.24.1
- @pandacss/is-valid-prop@0.24.1
- @pandacss/logger@0.24.1
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
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/error@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- 1ea7459c: Fix performance issue where process could get slower due to postcss rules held in memory.
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

- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/error@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- 11753fea: Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/logger@0.22.0

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

### Patch Changes

- 788aaba3: Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains
  an URL.

  ```tsx
  const App = () => {
    // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
    // but since it's an URL, it would produce invalid CSS
    // we now check if the property value is an URL and skip it if needed
    return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />;
  };
  ```

- d81dcbe6: - Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the
  normalization that happens internally.
  - Fix issue where Preact JSX types are not merging recipes correctly
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

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/token-dictionary@0.20.1
- @pandacss/error@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- 4ba982f3: Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

  ```ts
  css({
    "@container (min-width: token(sizes.xl))": {
      color: "green.300",
    },
    "@media (min-width: token(sizes.2xl))": {
      color: "red.300",
    },
  });
  ```

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 9f5711f9: Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache
  not being cleared as needed.
- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/error@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/shared@0.18.3
- @pandacss/token-dictionary@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/token-dictionary@0.18.2
- @pandacss/error@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 8c76cd0f: - Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints

  ```jsx
  css({ hideBelow: "lg" });
  // => @media screen and (max-width: 63.9975em) { background: red; }
  ```

  - Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

  ```jsx
  css({ hideFrom: "800px" });
  // => @media screen and (min-width: 800px) { background: red; }
  ```

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- a6dfc944: Fix issue where using array syntax in config recipe generates invalid css
  - @pandacss/error@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/error@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- aea28c9f: Fix issue where using scale css property adds an additional 'px'
- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- e73ea803: Automatically add each recipe slots to the `jsx` property, with a dot notation

  ```ts
  const button = defineSlotRecipe({
    className: "button",
    slots: ["root", "icon", "label"],
    // ...
  });
  ```

  will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- 20f4e204: Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/error@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/shared@0.15.5
- @pandacss/token-dictionary@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/error@0.15.4
- @pandacss/logger@0.15.4
- @pandacss/shared@0.15.4
- @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work
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
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 848936e0: Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

  ```js
  import { css } from "../styled-system/css";

  const className = css({
    "@media screen and (min-width: token(sizes.4xl))": {
      color: "green.400",
    },
  });
  ```

- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Minor Changes

- bc3b077d: Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher
  specificity

### Patch Changes

- dd47b6e6: Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- e6459a59: The utility transform fn now allow retrieving the token object with the raw value/conditions as currently
  there's no way to get it from there.
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 02161d41: Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token
  were left unchanged (due to the `.`)

  Before:

  ```css
  * {
    color: token(colors.magenta, pink);
  }
  ```

  Now:

  ```css
  * {
    color: token("colors.magenta", pink);
  }
  ```

- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [d0fbc7cc]
  - @pandacss/error@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/token-dictionary@0.12.0
- @pandacss/error@0.12.0
- @pandacss/logger@0.12.0
- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
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

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/error@0.10.0
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
  - @pandacss/types@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

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

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 12c900ee: Fix issue where unitless grid properties were converted to pixel values
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

- ef1dd676: Fix issue where `staticCss` did not generate all variants in the array of `css` rules
- b50675ca: Refactor parser to support extracting `css` prop in JSX elements correctly.
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

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

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

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

- 2a1e9386: Fix issue where aspect ratio css property adds `px`
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/error@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2

* path.join('-'), }) }, }, })

````

Will now allow you to use the following syntax for token path:

```diff
- css({ boxShadow: '10px 10px 10px {colors.$primary}' })
+ css({ boxShadow: '10px 10px 10px {$colors-primary}' })

- token.var('colors.$primary')
+ token.var('$colors-black')
````

- 4736057: Fix an issue with recipes that lead to in-memory duplication the resulting CSS, which would increase the time
  taken to output the CSS after each extraction in the same HMR session (by a few ms).
- 5a205e7: Fix conditions accessing `Cannot read properties of undefined (reading 'raw')`
- Updated dependencies [34d94cf]
- Updated dependencies [e855c64]
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/token-dictionary@0.33.0
  - @pandacss/types@0.33.0
  - @pandacss/logger@0.33.0
  - @pandacss/is-valid-prop@0.33.0
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

- f419993: - Prevent extracting style props of `styled` when not explicitly imported

  - Allow using multiple aliases for the same identifier for the `/css` entrypoints just like `/patterns` and `/recipes`

  ```ts
  import { css } from "../styled-system/css";
  import { css as css2 } from "../styled-system/css";

  css({ display: "flex" });
  css2({ flexDirection: "column" }); // this wasn't working before, now it does
  ```

- Updated dependencies [a032375]
- Updated dependencies [5184771]
- Updated dependencies [6d8c884]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/token-dictionary@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/is-valid-prop@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Minor Changes

- b32d817: Switch from `em` to `rem` for breakpoints and container queries to prevent side effects.

### Patch Changes

- 433a364: Automatically generate a recipe `compoundVariants` when using `staticCss`
- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/shared@0.32.0
  - @pandacss/types@0.32.0
  - @pandacss/token-dictionary@0.32.0
  - @pandacss/logger@0.32.0
  - @pandacss/is-valid-prop@0.32.0

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

- a17fe387: - Add a `config.polyfill` option that will polyfill the CSS @layer at-rules using a
  [postcss plugin](https://www.npmjs.com/package/@csstools/postcss-cascade-layers)
  - And `--polyfill` flag to `panda` and `panda cssgen` commands

### Patch Changes

- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/token-dictionary@0.31.0
  - @pandacss/is-valid-prop@0.31.0

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
  - @pandacss/logger@0.30.2
  - @pandacss/token-dictionary@0.30.2
  - @pandacss/is-valid-prop@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/is-valid-prop@0.30.1
- @pandacss/logger@0.30.1
- @pandacss/shared@0.30.1
- @pandacss/token-dictionary@0.30.1
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

- a5c75607: Fix an issue (introduced in v0.29) with `panda init` and add an assert on the new `colorMix` utility
  function
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
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

- f778d3e5: You can now set and override `defaultValues` in pattern configurations.

  Here's an example of how to define a new `hstack` pattern with a default `gap` value of `40px`:

  ```js
  defineConfig({
    patterns: {
      hstack: {
        properties: {
          justify: { type: "property", value: "justifyContent" },
          gap: { type: "property", value: "gap" },
        },
        // you can also use a token like '10'
        defaultValues: { gap: "40px" },
        transform(props) {
          const { justify, gap, ...rest } = props;
          return {
            display: "flex",
            alignItems: "center",
            justifyContent: justify,
            gap,
            ...rest,
          };
        },
      },
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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/is-valid-prop@0.29.0
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

- e463ce0e: Fix the issue in the utility configuration where shorthand without `className` returns incorrect CSS when
  using the shorthand version.

  ```js
  utilities: {
    extend: {
      coloredBorder: {
        shorthand: 'cb', // no classname, returns incorrect css
        values: ['red', 'green', 'blue'],
        transform(value) {
          return {
            border: `1px solid ${value}`,
          };
        },
      },
    },
  },
  ```

- 77cab9fe: Fix a regression with globalCss selector order

  ```ts
  {
      globalCss: {
          html: {
            ".aaa": {
              color: "red.100",
              "& .bbb": {
                color: "red.200",
                "& .ccc": {
                  color: "red.300"
                }
              }
            }
          },
      }
  }
  ```

  would incorrectly generate (regression introduced in v0.26.2)

  ```css
  .aaa html {
    color: var(--colors-red-100);
  }

  .aaa html .bbb {
    color: var(--colors-red-200);
  }

  .aaa html .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

  will now correctly generate again:

  ```css
  html .aaa {
    color: var(--colors-red-100);
  }

  html .aaa .bbb {
    color: var(--colors-red-200);
  }

  html .aaa .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

- 9d000dcd: Fix a regression with rule insertion order after triggering HMR that re-uses some CSS already generated in
  previous triggers, introuced in v0.27.0
- 6d7e7b07: Slight perf improvement by caching a few computed properties that contains a loop
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/error@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- 1ed4df77: Fix issue where HMR doesn't work when tsconfig paths is used.
- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/error@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/error@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/token-dictionary@0.27.1
  - @pandacss/error@0.27.1
  - @pandacss/is-valid-prop@0.27.1
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
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/error@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/error@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/error@0.26.1
- @pandacss/is-valid-prop@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- 14033e00: Display better CssSyntaxError logs
- d420c676: Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in
  ESLint Plugin and Node.js.
- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/error@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

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

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- de282f60: Fix issue where `base` doesn't work within css function

  ```jsx
  css({
    // This didn't work, but now it does
    base: { color: "blue" },
  });
  ```

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/error@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value
- 61ebf3d2: Fix issue where config slot recipes with compound variants were not processed correctly
- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/error@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/error@0.24.1
- @pandacss/is-valid-prop@0.24.1
- @pandacss/logger@0.24.1
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
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/error@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- 1ea7459c: Fix performance issue where process could get slower due to postcss rules held in memory.
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

- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/error@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- 11753fea: Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/logger@0.22.0

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

### Patch Changes

- 788aaba3: Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains
  an URL.

  ```tsx
  const App = () => {
    // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
    // but since it's an URL, it would produce invalid CSS
    // we now check if the property value is an URL and skip it if needed
    return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />;
  };
  ```

- d81dcbe6: - Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the
  normalization that happens internally.
  - Fix issue where Preact JSX types are not merging recipes correctly
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

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/token-dictionary@0.20.1
- @pandacss/error@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- 4ba982f3: Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

  ```ts
  css({
    "@container (min-width: token(sizes.xl))": {
      color: "green.300",
    },
    "@media (min-width: token(sizes.2xl))": {
      color: "red.300",
    },
  });
  ```

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 9f5711f9: Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache
  not being cleared as needed.
- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/error@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/shared@0.18.3
- @pandacss/token-dictionary@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/token-dictionary@0.18.2
- @pandacss/error@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 8c76cd0f: - Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints

  ```jsx
  css({ hideBelow: "lg" });
  // => @media screen and (max-width: 63.9975em) { background: red; }
  ```

  - Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

  ```jsx
  css({ hideFrom: "800px" });
  // => @media screen and (min-width: 800px) { background: red; }
  ```

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- a6dfc944: Fix issue where using array syntax in config recipe generates invalid css
  - @pandacss/error@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/error@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- aea28c9f: Fix issue where using scale css property adds an additional 'px'
- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- e73ea803: Automatically add each recipe slots to the `jsx` property, with a dot notation

  ```ts
  const button = defineSlotRecipe({
    className: "button",
    slots: ["root", "icon", "label"],
    // ...
  });
  ```

  will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- 20f4e204: Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/error@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/shared@0.15.5
- @pandacss/token-dictionary@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/error@0.15.4
- @pandacss/logger@0.15.4
- @pandacss/shared@0.15.4
- @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work
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
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 848936e0: Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

  ```js
  import { css } from "../styled-system/css";

  const className = css({
    "@media screen and (min-width: token(sizes.4xl))": {
      color: "green.400",
    },
  });
  ```

- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Minor Changes

- bc3b077d: Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher
  specificity

### Patch Changes

- dd47b6e6: Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- e6459a59: The utility transform fn now allow retrieving the token object with the raw value/conditions as currently
  there's no way to get it from there.
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 02161d41: Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token
  were left unchanged (due to the `.`)

  Before:

  ```css
  * {
    color: token(colors.magenta, pink);
  }
  ```

  Now:

  ```css
  * {
    color: token("colors.magenta", pink);
  }
  ```

- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [d0fbc7cc]
  - @pandacss/error@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/token-dictionary@0.12.0
- @pandacss/error@0.12.0
- @pandacss/logger@0.12.0
- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
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

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/error@0.10.0
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
  - @pandacss/types@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

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

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 12c900ee: Fix issue where unitless grid properties were converted to pixel values
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

- ef1dd676: Fix issue where `staticCss` did not generate all variants in the array of `css` rules
- b50675ca: Refactor parser to support extracting `css` prop in JSX elements correctly.
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

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

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

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

- 2a1e9386: Fix issue where aspect ratio css property adds `px`
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/error@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2

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
  - @pandacss/token-dictionary@0.30.0
  - @pandacss/shared@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/is-valid-prop@0.30.0

## 0.29.1

### Patch Changes

- a5c75607: Fix an issue (introduced in v0.29) with `panda init` and add an assert on the new `colorMix` utility
  function
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
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

- f778d3e5: You can now set and override `defaultValues` in pattern configurations.

  Here's an example of how to define a new `hstack` pattern with a default `gap` value of `40px`:

  ```js
  defineConfig({
    patterns: {
      hstack: {
        properties: {
          justify: { type: "property", value: "justifyContent" },
          gap: { type: "property", value: "gap" },
        },
        // you can also use a token like '10'
        defaultValues: { gap: "40px" },
        transform(props) {
          const { justify, gap, ...rest } = props;
          return {
            display: "flex",
            alignItems: "center",
            justifyContent: justify,
            gap,
            ...rest,
          };
        },
      },
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
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/token-dictionary@0.29.0
  - @pandacss/is-valid-prop@0.29.0
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

- e463ce0e: Fix the issue in the utility configuration where shorthand without `className` returns incorrect CSS when
  using the shorthand version.

  ```js
  utilities: {
    extend: {
      coloredBorder: {
        shorthand: 'cb', // no classname, returns incorrect css
        values: ['red', 'green', 'blue'],
        transform(value) {
          return {
            border: `1px solid ${value}`,
          };
        },
      },
    },
  },
  ```

- 77cab9fe: Fix a regression with globalCss selector order

  ```ts
  {
      globalCss: {
          html: {
            ".aaa": {
              color: "red.100",
              "& .bbb": {
                color: "red.200",
                "& .ccc": {
                  color: "red.300"
                }
              }
            }
          },
      }
  }
  ```

  would incorrectly generate (regression introduced in v0.26.2)

  ```css
  .aaa html {
    color: var(--colors-red-100);
  }

  .aaa html .bbb {
    color: var(--colors-red-200);
  }

  .aaa html .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

  will now correctly generate again:

  ```css
  html .aaa {
    color: var(--colors-red-100);
  }

  html .aaa .bbb {
    color: var(--colors-red-200);
  }

  html .aaa .bbb .ccc {
    color: var(--colors-red-300);
  }
  ```

- 9d000dcd: Fix a regression with rule insertion order after triggering HMR that re-uses some CSS already generated in
  previous triggers, introuced in v0.27.0
- 6d7e7b07: Slight perf improvement by caching a few computed properties that contains a loop
- Updated dependencies [f58f6df2]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
  - @pandacss/types@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/error@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- 1ed4df77: Fix issue where HMR doesn't work when tsconfig paths is used.
- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/error@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/error@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/token-dictionary@0.27.1
  - @pandacss/error@0.27.1
  - @pandacss/is-valid-prop@0.27.1
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
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/error@0.27.0
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/error@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/error@0.26.1
- @pandacss/is-valid-prop@0.26.1
- @pandacss/logger@0.26.1
- @pandacss/shared@0.26.1
- @pandacss/token-dictionary@0.26.1
- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- 14033e00: Display better CssSyntaxError logs
- d420c676: Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in
  ESLint Plugin and Node.js.
- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/error@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

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

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- de282f60: Fix issue where `base` doesn't work within css function

  ```jsx
  css({
    // This didn't work, but now it does
    base: { color: "blue" },
  });
  ```

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/error@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- 71e82a4e: Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being
  seen as a truthy value
- 61ebf3d2: Fix issue where config slot recipes with compound variants were not processed correctly
- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/error@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/error@0.24.1
- @pandacss/is-valid-prop@0.24.1
- @pandacss/logger@0.24.1
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
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/error@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- 1ea7459c: Fix performance issue where process could get slower due to postcss rules held in memory.
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

- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/error@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- 11753fea: Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/logger@0.22.0

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

### Patch Changes

- 788aaba3: Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains
  an URL.

  ```tsx
  const App = () => {
    // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
    // but since it's an URL, it would produce invalid CSS
    // we now check if the property value is an URL and skip it if needed
    return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />;
  };
  ```

- d81dcbe6: - Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the
  normalization that happens internally.
  - Fix issue where Preact JSX types are not merging recipes correctly
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

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/token-dictionary@0.20.1
- @pandacss/error@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- 4ba982f3: Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

  ```ts
  css({
    "@container (min-width: token(sizes.xl))": {
      color: "green.300",
    },
    "@media (min-width: token(sizes.2xl))": {
      color: "red.300",
    },
  });
  ```

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 9f5711f9: Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache
  not being cleared as needed.
- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/error@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/shared@0.18.3
- @pandacss/token-dictionary@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/token-dictionary@0.18.2
- @pandacss/error@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 8c76cd0f: - Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints

  ```jsx
  css({ hideBelow: "lg" });
  // => @media screen and (max-width: 63.9975em) { background: red; }
  ```

  - Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

  ```jsx
  css({ hideFrom: "800px" });
  // => @media screen and (min-width: 800px) { background: red; }
  ```

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- a6dfc944: Fix issue where using array syntax in config recipe generates invalid css
  - @pandacss/error@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/error@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- aea28c9f: Fix issue where using scale css property adds an additional 'px'
- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- e73ea803: Automatically add each recipe slots to the `jsx` property, with a dot notation

  ```ts
  const button = defineSlotRecipe({
    className: "button",
    slots: ["root", "icon", "label"],
    // ...
  });
  ```

  will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- 20f4e204: Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/error@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/shared@0.15.5
- @pandacss/token-dictionary@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/error@0.15.4
- @pandacss/logger@0.15.4
- @pandacss/shared@0.15.4
- @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work
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
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 848936e0: Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

  ```js
  import { css } from "../styled-system/css";

  const className = css({
    "@media screen and (min-width: token(sizes.4xl))": {
      color: "green.400",
    },
  });
  ```

- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Minor Changes

- bc3b077d: Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher
  specificity

### Patch Changes

- dd47b6e6: Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- e6459a59: The utility transform fn now allow retrieving the token object with the raw value/conditions as currently
  there's no way to get it from there.
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 02161d41: Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token
  were left unchanged (due to the `.`)

  Before:

  ```css
  * {
    color: token(colors.magenta, pink);
  }
  ```

  Now:

  ```css
  * {
    color: token("colors.magenta", pink);
  }
  ```

- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [d0fbc7cc]
  - @pandacss/error@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/token-dictionary@0.12.0
- @pandacss/error@0.12.0
- @pandacss/logger@0.12.0
- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
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

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/error@0.10.0
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
  - @pandacss/types@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

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

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 12c900ee: Fix issue where unitless grid properties were converted to pixel values
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

- ef1dd676: Fix issue where `staticCss` did not generate all variants in the array of `css` rules
- b50675ca: Refactor parser to support extracting `css` prop in JSX elements correctly.
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

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

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

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

- 2a1e9386: Fix issue where aspect ratio css property adds `px`
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/error@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
