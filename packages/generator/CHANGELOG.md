# @pandacss/generator

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

- 1e50336: Fix type import
- b1e9e36: - Fix css reset regressions where:
  - first letter gets a different color
  - input or select gets a default border
- Updated dependencies [96b47b3]
- Updated dependencies [bc09d89]
- Updated dependencies [7a96298]
- Updated dependencies [2c8b933]
  - @pandacss/types@0.38.0
  - @pandacss/core@0.38.0
  - @pandacss/token-dictionary@0.38.0
  - @pandacss/shared@0.38.0
  - @pandacss/logger@0.38.0
  - @pandacss/is-valid-prop@0.38.0

## 0.37.2

### Patch Changes

- 74dfb3e: - Fix `sva` typings, the `splitVariantProps` was missing from the `d.ts` file

  - Add a `getVariantProps` helper to the slot recipes API (`sva` and `config slot recipes`)

  ```ts
  import { sva } from '../styled-system/css'
  import { getVariantProps } from '../styled-system/recipes'

  const button = sva({
    slots: ['root', 'icon'],
    // ...
    variants: {
      size: {
        sm: {
          // ...
        },
        md: {
          // ...
        },
      },
      variant: {
        primary: {
          // ...
        },
        danger: {
          // ...
        }
      }
    }
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    }
  })

  // ✅ this will return the computed variants based on the defaultVariants + props passed
  const buttonProps = button.getVariantProps({ size: "sm" })
  //    ^? { size: "sm", variant: "primary" }
  ```

- b3beef4: Make `WithImportant<T>` more performant and ensure typescript is happy. This changes will make code
  autocompletion and ts-related linting much faster than before.
- Updated dependencies [74dfb3e]
  - @pandacss/types@0.37.2
  - @pandacss/core@0.37.2
  - @pandacss/logger@0.37.2
  - @pandacss/token-dictionary@0.37.2
  - @pandacss/is-valid-prop@0.37.2
  - @pandacss/shared@0.37.2

## 0.37.1

### Patch Changes

- 885963c: - Fix an issue where the `compoundVariants` classes would not be present at runtime when using
  `config recipes`

  ```ts
  // panda.config.ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    theme: {
      extend: {
        recipes: {
          button: {
            // ...
            variants: {
              size: {
                sm: {
                  fontSize: 'sm',
                },
                // ...
              },
            },
            compoundVariants: [
              {
                size: 'sm',
                css: { color: 'blue.100'},
              },
            ],
          },
        },
      },
    },
  })

  // app.tsx
  const Button = styled('button', button)

  const App = () => {
    return (
      // ❌ this would only have the classes `button button--size_sm`
      // the `text_blue` was missing
      // ✅ it's now fixed -> `button button--size_sm text_blue`
      <Button size="sm">Click me</Button>
    )
  }
  ```

  - Add a `getVariantProps` helper to the recipes API (`cva` and `config recipes`)

  ```ts
  import { cva } from '../styled-system/css'
  import { getVariantProps } from '../styled-system/recipes'

  const button = cva({
      // ...
    variants: {
      size: {
        sm: {
          fontSize: 'sm',
        },
        md: {
          fontSize: 'md',
        },
      },
      variant: {
        primary: {
          backgroundColor: 'blue.500',
        },
        danger: {
          backgroundColor: 'red.500',
        }
      }
    }
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    }
  })

  // ✅ this will return the computed variants based on the defaultVariants + props passed
  const buttonProps = button.getVariantProps({ size: "sm" })
  //    ^? { size: "sm", variant: "primary" }
  ```

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
  - @pandacss/core@0.37.1
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

### Patch Changes

- 4e6cf85: Add missing typings for CSS vars in properties bound to utilities (and that are not part of the list affected
  by `strictPropertyValues`)
- Updated dependencies [7daf159]
- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/shared@0.37.0
  - @pandacss/types@0.37.0
  - @pandacss/core@0.37.0
  - @pandacss/token-dictionary@0.37.0
  - @pandacss/logger@0.37.0
  - @pandacss/is-valid-prop@0.37.0

## 0.36.1

### Patch Changes

- bd0cb07: Fix theme variants typings
- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1
  - @pandacss/core@0.36.1
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

- 861a280: Introduce a new `globalVars` config option to define type-safe
  [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) and custom
  [CSS @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property).

  Example:

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    globalVars: {
      "--some-color": "red",
      "--button-color": {
        syntax: "<color>",
        inherits: false,
        initialValue: "blue",
      },
    },
  });
  ```

  > Note: Keys defined in `globalVars` will be available as a value for _every_ utilities, as they're not bound to token
  > categories.

  ```ts
  import { css } from "../styled-system/css";

  const className = css({
    "--button-color": "colors.red.300",
    // ^^^^^^^^^^^^  will be suggested

    backgroundColor: "var(--button-color)",
    //                ^^^^^^^^^^^^^^^^^^  will be suggested
  });
  ```

- 656ff02: Fix `strictPropertyValues` typings should allow for `CssVars` (either predefined from `globalVars` or any
  custom CSS variable)

  ```ts
  import { defineConfig } from "@pandacss/dev";

  export default defineConfig({
    // ...
    strictPropertyValues: true,
    globalVars: {
      extend: {
        "--some-color": "red",
        "--button-color": {
          syntax: "<color>",
          inherits: false,
          initialValue: "blue",
        },
      },
    },
  });
  ```

  ```ts
  css({
    // ❌ was not allowed before when `strictPropertyValues` was enabled
    display: "var(--button-color)", // ✅ will now be allowed/suggested
  });
  ```

  If no `globalVars` are defined, any `var(--*)` will be allowed

  ```ts
  css({
    // ✅ will be allowed
    display: "var(--xxx)",
  });
  ```

- 340f4f1: Fix `Expression produces a union type that is too complex to represent` with `splitCssProps` because of
  `JsxStyleProps` type
- Updated dependencies [3af3940]
- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/token-dictionary@0.36.0
  - @pandacss/types@0.36.0
  - @pandacss/core@0.36.0
  - @pandacss/is-valid-prop@0.36.0
  - @pandacss/logger@0.36.0
  - @pandacss/shared@0.36.0

## 0.35.0

### Patch Changes

- 5585696: Allow using `!` or `!important` when using `strictTokens: true` (without TS throwing an error)
- 44589ec: Change the `styled-system/token` JS token function to use raw value for semanticToken that do not have
  conditions other than `base`

  ```ts
  export default defineConfig({
    semanticTokens: {
      colors: {
        blue: { value: "blue" },
        green: {
          value: {
            base: "green",
            _dark: "white",
          },
        },
        red: {
          value: {
            base: "red",
          },
        },
      },
    },
  });
  ```

  This is the output of the `styled-system/token` JS token function:

  ```diff
  const tokens = {
      "colors.blue": {
  -     "value": "var(--colors-blue)",
  +     "value": "blue",
        "variable": "var(--colors-blue)"
      },
      "colors.green": {
        "value": "var(--colors-green)",
        "variable": "var(--colors-green)"
      },
      "colors.red": {
  -     "value": "var(--colors-red)",
  +     "value": "red",
        "variable": "var(--colors-red)"
      },
  }
  ```

- a0c4d27: Add an optional `className` key in `sva` config which will can be used to target slots in the DOM.

  Each slot will contain a `${className}__${slotName}` class in addition to the atomic styles.

  ```tsx
  import { sva } from "../styled-system/css";

  const button = sva({
    className: "btn",
    slots: ["root", "text"],
    base: {
      root: {
        bg: "blue.500",
        _hover: {
          // v--- 🎯 this will target the `text` slot
          "& .btn__text": {
            color: "white",
          },
        },
      },
    },
  });

  export const App = () => {
    const classes = button();
    return (
      <div className={classes.root}>
        <div className={classes.text}>Click me</div>
      </div>
    );
  };
  ```

- Updated dependencies [f2fdc48]
- Updated dependencies [50db354]
- Updated dependencies [c459b43]
- Updated dependencies [f6befbf]
- Updated dependencies [a0c4d27]
  - @pandacss/token-dictionary@0.35.0
  - @pandacss/types@0.35.0
  - @pandacss/core@0.35.0
  - @pandacss/logger@0.35.0
  - @pandacss/is-valid-prop@0.35.0
  - @pandacss/shared@0.35.0

## 0.34.3

### Patch Changes

- 39f529e: Allow color opacity modifier when using `strictTokens`, e.g `color: "blue.200/50"` will not throw a TS error
  anymore
- 4576a60: Fix nested `styled` factory composition

  ```tsx
  import { styled } from "../styled-system/jsx";

  const BasicBox = styled("div", { base: { fontSize: "10px" } });
  const ExtendedBox1 = styled(BasicBox, { base: { fontSize: "20px" } });
  const ExtendedBox2 = styled(ExtendedBox1, { base: { fontSize: "30px" } });

  export const App = () => {
    return (
      <>
        {/* ✅ fs_10px */}
        <BasicBox>text1</BasicBox>
        {/* ✅ fs_20px */}
        <ExtendedBox1>text2</ExtendedBox1>
        {/* BEFORE: ❌ fs_10px fs_30px */}
        {/* NOW: ✅ fs_30px */}
        <ExtendedBox2>text3</ExtendedBox2>
      </>
    );
  };
  ```

  - @pandacss/core@0.34.3
  - @pandacss/is-valid-prop@0.34.3
  - @pandacss/logger@0.34.3
  - @pandacss/shared@0.34.3
  - @pandacss/token-dictionary@0.34.3
  - @pandacss/types@0.34.3

## 0.34.2

### Patch Changes

- a48f963: Fix `strictPropertyValues` with border\* properties

  We had listed `border\*` properties as affected by `strictPropertyValues` but they shouldn't be restricted as their
  syntax is too complex to be restricted. This removes any `border*` properties that do not specifically end with
  `Style` like `borderTopStyle`.

  ```ts
  import { css } from "../styled-system/css";

  css({
    borderTop: "1px solid red", // ✅ will now be fine as it should be
    borderTopStyle: "abc", // ✅ will still report a TS error
  });
  ```

  ```diff

    type StrictableProps =
      | 'alignContent'
      | 'alignItems'
      | 'alignSelf'
      | 'all'
      | 'animationComposition'
      | 'animationDirection'
      | 'animationFillMode'
      | 'appearance'
      | 'backfaceVisibility'
      | 'backgroundAttachment'
      | 'backgroundClip'
      | 'borderCollapse'
  -    | 'border'
  -    | 'borderBlock'
  -    | 'borderBlockEnd'
  -    | 'borderBlockStart'
  -    | 'borderBottom'
  -    | 'borderInline'
  -    | 'borderInlineEnd'
  -    | 'borderInlineStart'
  -    | 'borderLeft'
  -    | 'borderRight'
  -    | 'borderTop'
      | 'borderBlockEndStyle'
      | 'borderBlockStartStyle'
      | 'borderBlockStyle'
      | 'borderBottomStyle'
      | 'borderInlineEndStyle'
      | 'borderInlineStartStyle'
      | 'borderInlineStyle'
      | 'borderLeftStyle'
      | 'borderRightStyle'
      | 'borderTopStyle'
      | 'boxDecorationBreak'
      | 'boxSizing'
      | 'breakAfter'
      | 'breakBefore'
      | 'breakInside'
      | 'captionSide'
      | 'clear'
      | 'columnFill'
      | 'columnRuleStyle'
      | 'contentVisibility'
      | 'direction'
      | 'display'
      | 'emptyCells'
      | 'flexDirection'
      | 'flexWrap'
      | 'float'
      | 'fontKerning'
      | 'forcedColorAdjust'
      | 'isolation'
      | 'lineBreak'
      | 'mixBlendMode'
      | 'objectFit'
      | 'outlineStyle'
      | 'overflow'
      | 'overflowX'
      | 'overflowY'
      | 'overflowBlock'
      | 'overflowInline'
      | 'overflowWrap'
      | 'pointerEvents'
      | 'position'
      | 'resize'
      | 'scrollBehavior'
      | 'touchAction'
      | 'transformBox'
      | 'transformStyle'
      | 'userSelect'
      | 'visibility'
      | 'wordBreak'
      | 'writingMode'
  ```

- Updated dependencies [0bf09f2]
  - @pandacss/core@0.34.2
  - @pandacss/types@0.34.2
  - @pandacss/is-valid-prop@0.34.2
  - @pandacss/logger@0.34.2
  - @pandacss/shared@0.34.2
  - @pandacss/token-dictionary@0.34.2

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

- Updated dependencies [d4942e0]
  - @pandacss/token-dictionary@0.34.1
  - @pandacss/core@0.34.1
  - @pandacss/is-valid-prop@0.34.1
  - @pandacss/logger@0.34.1
  - @pandacss/shared@0.34.1
  - @pandacss/types@0.34.1

## 0.34.0

### Patch Changes

- 1c63216: Add a config validation check to prevent using spaces in token keys, show better error logs when there's a
  CSS parsing error
- 7e348ae: Fix `splitCssProps` typings, it would sometimes throw
  `Expression produces a union type that is too complex to represent"`
- Updated dependencies [64d5144]
- Updated dependencies [d1516c8]
  - @pandacss/token-dictionary@0.34.0
  - @pandacss/core@0.34.0
  - @pandacss/types@0.34.0
  - @pandacss/logger@0.34.0
  - @pandacss/is-valid-prop@0.34.0
  - @pandacss/shared@0.34.0

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

- Updated dependencies [a032375]
- Updated dependencies [31071ba]
- Updated dependencies [5184771]
- Updated dependencies [f419993]
- Updated dependencies [6d8c884]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/core@0.32.1
  - @pandacss/token-dictionary@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/is-valid-prop@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Minor Changes

- b32d817: Switch from `em` to `rem` for breakpoints and container queries to prevent side effects.

### Patch Changes

- 60cace3: This change allows the user to set `jsxFramework` to any string to enable extracting JSX components.

  ***

  Context: In a previous version, Panda's extractor used to always extract JSX style props even when not specifying a
  `jsxFramework`. This was considered a bug and has been fixed, which reduced the amount of work panda does and
  artifacts generated if the user doesn't need jsx.

  Now, in some cases like when using Svelte or Astro, the user might still to use & extract JSX style props, but the
  `jsxFramework` didn't have a way to specify that. This change allows the user to set `jsxFramework` to any string to
  enable extracting JSX components without generating any artifacts.

- Updated dependencies [433a364]
- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
- Updated dependencies [b32d817]
  - @pandacss/core@0.32.0
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

### Patch Changes

- 8f36f9af: Add a `RecipeVariant` type to get the variants in a strict object from `cva` function. This complements the
  `RecipeVariantprops` type that extracts the variant as optional props, mostly intended for JSX components.
- 2d69b340: Fix `styled` factory nested composition with `cva`
- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/core@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/token-dictionary@0.31.0
  - @pandacss/is-valid-prop@0.31.0

## 0.30.2

### Patch Changes

- 97efdb43: Fix issue where `v-model` does not work in vue styled factory
- 7233cd2e: Fix issue where styled factory in Solid.js could results in `Maximum call stack exceeded` when composing
  with another library that uses the `as` prop.
- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/core@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/token-dictionary@0.30.2
  - @pandacss/is-valid-prop@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/core@0.30.1
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

- Updated dependencies [a5c75607]
  - @pandacss/core@0.29.1
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
  - @pandacss/types@0.29.1

## 0.29.0

### Minor Changes

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

### Patch Changes

- 2e32794d: Set `display: none` for hidden elements in `reset` css
- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [f778d3e5]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/core@0.29.0
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

- 1edadf30: Fix issue where `/* @__PURE__ */` annotation threw a warning in Vite build due to incorrect placement.
- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [e463ce0e]
- Updated dependencies [77cab9fe]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
- Updated dependencies [9d000dcd]
- Updated dependencies [6d7e7b07]
  - @pandacss/types@0.28.0
  - @pandacss/core@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/core@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/core@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/core@0.27.1
  - @pandacss/token-dictionary@0.27.1
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

- dce0b3b2: Enhance `splitCssProps` typings
- 74ac0d9d: Improve the performance of the runtime transform functions by caching their results (css, cva, sva,
  recipe/slot recipe, patterns)

  > See detailed breakdown of the performance improvements
  > [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

- Updated dependencies [84304901]
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0
  - @pandacss/core@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/core@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- 6de4c737: Hotfix `strictTokens` after introducing `strictPropertyValues`
  - @pandacss/core@0.26.1
  - @pandacss/is-valid-prop@0.26.1
  - @pandacss/logger@0.26.1
  - @pandacss/shared@0.26.1
  - @pandacss/token-dictionary@0.26.1
  - @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- a179d74f: tl;dr:

  - `config.strictTokens` will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`,
    etc.
  - `config.strictPropertyValues` is added and will throw for properties that do not have config tokens, such as
    `display`, `content`, `willChange`, etc. when the value is not a predefined CSS value.

  ***

  In version
  [0.19.0 we changed `config.strictTokens`](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0190---2023-11-24)
  typings a bit so that the only property values allowed were the config tokens OR the predefined CSS values, ex: `flex`
  for the property `display`, which prevented typos such as `display: 'aaa'`.

  The problem with this change is that it means you would have to provide every CSS properties a given set of values so
  that TS wouldn't throw any error. Thus, we will partly revert this change and make it so that `config.strictTokens`
  shouldn't affect properties that do not have config tokens, such as `content`, `willChange`, `display`, etc.

  v0.19.0:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ would throw since 'abc' is not part of predefined values of 'display' even thought there is no config token for 'abc'
  ```

  now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will not throw there is no config token for 'abc'
  ```

  Instead, if you want the v.19.0 behavior, you can use the new `config.strictPropertyValues` option. You can combine it
  with `config.strictTokens` if you want to be strict on both properties with config tokens and properties without
  config tokens.

  The new `config.strictPropertyValues` option will only be applied to this exhaustive list of properties:

  ```ts
  type StrictableProps =
    | "alignContent"
    | "alignItems"
    | "alignSelf"
    | "all"
    | "animationComposition"
    | "animationDirection"
    | "animationFillMode"
    | "appearance"
    | "backfaceVisibility"
    | "backgroundAttachment"
    | "backgroundClip"
    | "borderCollapse"
    | "border"
    | "borderBlock"
    | "borderBlockEnd"
    | "borderBlockStart"
    | "borderBottom"
    | "borderInline"
    | "borderInlineEnd"
    | "borderInlineStart"
    | "borderLeft"
    | "borderRight"
    | "borderTop"
    | "borderBlockEndStyle"
    | "borderBlockStartStyle"
    | "borderBlockStyle"
    | "borderBottomStyle"
    | "borderInlineEndStyle"
    | "borderInlineStartStyle"
    | "borderInlineStyle"
    | "borderLeftStyle"
    | "borderRightStyle"
    | "borderTopStyle"
    | "boxDecorationBreak"
    | "boxSizing"
    | "breakAfter"
    | "breakBefore"
    | "breakInside"
    | "captionSide"
    | "clear"
    | "columnFill"
    | "columnRuleStyle"
    | "contentVisibility"
    | "direction"
    | "display"
    | "emptyCells"
    | "flexDirection"
    | "flexWrap"
    | "float"
    | "fontKerning"
    | "forcedColorAdjust"
    | "isolation"
    | "lineBreak"
    | "mixBlendMode"
    | "objectFit"
    | "outlineStyle"
    | "overflow"
    | "overflowX"
    | "overflowY"
    | "overflowBlock"
    | "overflowInline"
    | "overflowWrap"
    | "pointerEvents"
    | "position"
    | "resize"
    | "scrollBehavior"
    | "touchAction"
    | "transformBox"
    | "transformStyle"
    | "userSelect"
    | "visibility"
    | "wordBreak"
    | "writingMode";
  ```

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [14033e00]
- Updated dependencies [d420c676]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/core@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/core@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
- Updated dependencies [61ebf3d2]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/core@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- 10e74428: - Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS
  wasn't applied correctly
  - Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
    through the config recipes)
  - @pandacss/core@0.24.1
  - @pandacss/is-valid-prop@0.24.1
  - @pandacss/logger@0.24.1
  - @pandacss/shared@0.24.1
  - @pandacss/token-dictionary@0.24.1
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

- Updated dependencies [63b3f1f2]
- Updated dependencies [f6881022]
  - @pandacss/core@0.24.0
  - @pandacss/types@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- d30b1737: Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal`
  or `none` with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- a3b6ed5f: Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal
  parsing when not using `config.syntax` set to "template-literal"
- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [1ea7459c]
- Updated dependencies [80ada336]
- Updated dependencies [bd552b1f]
- Updated dependencies [840ed66b]
  - @pandacss/core@0.23.0
  - @pandacss/logger@0.23.0
  - @pandacss/is-valid-prop@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 8f4ce97c: Fix `slotRecipes` typings,
  [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added to `config.recipes`
  weren't added to `config.slotRecipes`
- 647f05c9: Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

  ```ts
  css({
    bg: "[#3B00B9]", // ✅ was okay
    _dark: {
      // ✅ was okay
      color: "[#3B00B9]",
    },

    // ❌ Not okay, will be fixed in this patch
    color: {
      _dark: "[#3B00B9]",
    },
  });
  ```

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
  - @pandacss/core@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- e83afef0: Update csstype to support newer css features

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties
- 9c0d3f8f: Fix regression where `styled-system/jsx/index` had the wrong exports
- c95c40bd: Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [11753fea]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/core@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/is-valid-prop@0.22.0
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

- 052283c2: Fix vue `styled` factory internal class merging, for example:

  ```vue
  <script setup>
  import { styled } from "../styled-system/jsx";

  const StyledButton = styled("button", {
    base: {
      bgColor: "red.300",
    },
  });
  </script>
  <template>
    <StyledButton id="test" class="test">
      <slot></slot>
    </StyledButton>
  </template>
  ```

  Will now correctly include the `test` class in the final output.

- Updated dependencies [788aaba3]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [d81dcbe6]
- Updated dependencies [105f74ce]
  - @pandacss/core@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/core@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/is-valid-prop@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- e4fdc64a: Fix issue where conditional recipe variant doesn't work as expected
- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [4ba982f3]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/core@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 61831040: Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.

  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)

- 92a7fbe5: Fix issue in preflight where monospace fallback pointed to the wrong variable
- 89f86923: Fix issue where css variables were not supported in layer styles and text styles types.
- 402afbee: Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for
  the property 'display') and throwing when using anything else than those, if no theme tokens was found on that
  property.

  Before:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ didn't throw even though 'abc' is not a valid value for 'display'
  ```

  Now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will throw since 'abc' is not a valid value for 'display'
  ```

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
- Updated dependencies [9f5711f9]
  - @pandacss/types@0.19.0
  - @pandacss/core@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- 78b940b2: Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
  - @pandacss/core@0.18.3
  - @pandacss/is-valid-prop@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/core@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
- Updated dependencies [8c76cd0f]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/core@0.18.1
  - @pandacss/is-valid-prop@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Minor Changes

- b7cb2073: Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

  ```tsx
  import { splitCssProps, styled } from "../styled-system/jsx";
  import type { HTMLStyledProps } from "../styled-system/types";

  function SplitComponent({ children, ...props }: HTMLStyledProps<"div">) {
    const [cssProps, restProps] = splitCssProps(props);
    return (
      <styled.div
        {...restProps}
        className={css(
          { display: "flex", height: "20", width: "20" },
          cssProps,
        )}
      >
        {children}
      </styled.div>
    );
  }

  // Usage

  function App() {
    return <SplitComponent margin="2">Click me</SplitComponent>;
  }
  ```

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/core@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- 6718f81b: Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- 3ce70c37: Fix issue where cva composition in styled components doens't work as expected.
- Updated dependencies [a6dfc944]
  - @pandacss/core@0.17.5
  - @pandacss/is-valid-prop@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/core@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/core@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/core@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 296d62b1: Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`

  Fixes https://github.com/chakra-ui/panda/issues/1549

- 42520626: Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- 9382e687: remove export types from jsx when no jsxFramework configuration
- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM
- Updated dependencies [aea28c9f]
- Updated dependencies [5ce359f6]
  - @pandacss/core@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

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

- fbf062c6: Added a new type to extract variants out of styled components

  ```tsx
  import { StyledVariantProps } from "../styled-system/jsx";

  const Button = styled("button", {
    base: { color: "black" },
    variants: {
      state: {
        error: { color: "red" },
        success: { color: "green" },
      },
    },
  });

  type ButtonVariantProps = StyledVariantProps<typeof Button>;
  //   ^ { state?: 'error' | 'success' | undefined }
  ```

### Patch Changes

- 93996aaf: Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`
- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [e73ea803]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/core@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/is-valid-prop@0.17.0
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

- 2b5cbf73: correct typings for Qwik components
- Updated dependencies [20f4e204]
  - @pandacss/core@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/is-valid-prop@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- d12aed2b: Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- 909fcbe8: - Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
- 3d5971e5: - **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events
  to the underlying element.
  - **Vue**: Fix regression in generated types
  - **Preact**: Fix regression in generated types
  - @pandacss/core@0.15.5
  - @pandacss/is-valid-prop@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
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

  - @pandacss/types@0.15.4
  - @pandacss/core@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- d34c8b48: Fix issue where HMR does not work for Vue JSX factory and patterns
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

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: "btn",
    base: { color: "green", fontSize: "16px" },
    variants: {
      size: { small: { fontSize: "14px" } },
    },
    compoundVariants: [{ size: "small", css: { color: "blue" } }],
  });
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button);

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    );
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/core@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 6d15776c: When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`).
  Sometimes TS will complain about types not being exported.

  - Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

  ```
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
  ```

  - Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

  ```
  src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
  src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
  src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
  ```

  - Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

  ```
   "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
  ```

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/core@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- 433f88cd: Fix issue in css reset where number input field spinner still show.
- 7499bbd2: Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Updated dependencies [848936e0]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/core@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- 93d9ee7e: Refactor: Prefer `NativeElements` type for vue jsx elements
- 35793d85: Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()`
  with `const button = cva({ ... })`)
- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [bc3b077d]
- Updated dependencies [39298609]
- Updated dependencies [dd47b6e6]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/core@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bdd30d18: Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6548f4f7: Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The
  inferred type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 542d1ebc: Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it.

  This is mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would
  use it like `css({ ... }, cssProps)`

- 39b20797: Change the `css.raw` function signature to match the one from
  [`css()`](https://github.com/chakra-ui/panda/pull/1264), to allow passing multiple style objects that will be smartly
  merged.
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
- Updated dependencies [02161d41]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/core@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- 192d5e49: Fix issue where `cva` is undefined in preact styled factory
  - @pandacss/core@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- a9690110: Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme`
  type.
- 32ceac3f: Fix an issue with custom JSX components not finding their matching patterns
- Updated dependencies [04b5fd6c]
  - @pandacss/core@0.13.0
  - @pandacss/is-valid-prop@0.13.0
  - @pandacss/logger@0.13.0
  - @pandacss/shared@0.13.0
  - @pandacss/token-dictionary@0.13.0
  - @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- 6588c8e0: - Change the `css` function signature to allow passing multiple style objects that will be smartly merged.

  - Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
  - Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments
    passed in. This is to allow the `css` function to merge the styles correctly.

  ```tsx
  import { css } from "../styled-system/css";
  css({ mx: "3", paddingTop: "4" }, { mx: "10", pt: "6" }); // => mx_10 pt_6
  ```

  > ⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to
  > its original classname concatenation behaviour.

  ```diff
  import { css, cx } from '../styled-system/css'

  const App = () => {
    return (
      <>
  -      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
  +      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
          Will result in `class="mx_10 pt_6"`
        </div>
      </>
    )
  }
  ```

  To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

  ```tsx title="src/components/Button.tsx"
  import { css } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      { display: "flex", alignItem: "center", color: "black" },
      cssProp,
    );
    return <button className={className}>{children}</button>;
  };
  ```

  Then you can use the `Button` component like this:

  ```tsx title="src/app/page.tsx"
  import { css } from "../../styled-system/css";
  import { Button, Thingy } from "./Button";

  export default function Page() {
    return (
      <Button css={{ color: "pink", _hover: { color: "red" } }}>
        will result in `class="d_flex items_center text_pink hover:text_red"`
      </Button>
    );
  }
  ```

  ***

  You can use this approach as well with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects
  to be merged as expected in any situation.

  **Pattern Example:**

  ```tsx title="src/components/Button.tsx"
  import { hstack } from "../../styled-system/patterns";
  import { css, cva } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    // using the flex pattern
    const hstackProps = hstack.raw({
      border: "1px solid",
      _hover: { color: "blue.400" },
    });

    // merging the styles
    const className = css(hstackProps, cssProp);

    return <button className={className}>{children}</button>;
  };
  ```

  **CVA Example:**

  ```tsx title="src/components/Button.tsx"
  import { css, cva } from "../../styled-system/css";

  const buttonRecipe = cva({
    base: { display: "flex", fontSize: "lg" },
    variants: {
      variant: {
        primary: { color: "white", backgroundColor: "blue.500" },
      },
    },
  });

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      // using the button recipe
      buttonRecipe.raw({ variant: "primary" }),

      // adding style overrides (internal)
      { _hover: { color: "blue.400" } },

      // adding style overrides (external)
      cssProp,
    );

    return <button className={className}>{props.children}</button>;
  };
  ```

- 36fdff89: Fix bug in generated js code for atomic slot recipe produce where `splitVariantProps` didn't work without
  the first slot key.
  - @pandacss/core@0.12.2
  - @pandacss/is-valid-prop@0.12.2
  - @pandacss/logger@0.12.2
  - @pandacss/shared@0.12.2
  - @pandacss/token-dictionary@0.12.2
  - @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- 599fbc1a: Fix issue where `AnimationName` type was generated wrongly if keyframes were not resolved
  - @pandacss/core@0.12.1
  - @pandacss/is-valid-prop@0.12.1
  - @pandacss/logger@0.12.1
  - @pandacss/shared@0.12.1
  - @pandacss/token-dictionary@0.12.1
  - @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- a41515de: Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- bf2ff391: Add `animationName` utility
- ad1518b8: fix failed styled component for solid-js when using recipe
  - @pandacss/core@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/is-valid-prop@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

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

- dfb3f85f: Add missing svg props types
- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/core@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- 5b95caf5: Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook)
  dependency
- 39b80b49: Fix an issue with the runtime className generation when using an utility that maps to multiple shorthands
- 1dc788bd: Fix issue where some style properties shows TS error when using `!important`
- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/core@0.11.0
  - @pandacss/token-dictionary@0.11.0
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

- 24e783b3: Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and
  further reduce it.

  `config.jsxStyleProps`:

  - When set to 'all', all style props are allowed.
  - When set to 'minimal', only the `css` prop is allowed.
  - When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
    - `<styled.div />` and `styled("div")` aren't valid
    - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- 386e5098: Update `RecipeVariantProps` to support slot recipes
- 6d4eaa68: Refactor code
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [2d2a42da]
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/core@0.10.0
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
  - @pandacss/core@0.9.0
  - @pandacss/token-dictionary@0.9.0
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

- 3f1e7e32: Adds the `{recipe}.raw()` in generated runtime
- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- be0ad578: Fix parser issue with TS path mappings
- b75905d8: Improve generated react jsx types to remove legacy ref. This fixes type composition issues.
- 0520ba83: Refactor generated recipe js code
- 156b6bde: Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`
- Updated dependencies [fb449016]
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/core@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- a9c189b7: Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/core@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- cd912f35: Fix `definePattern` module overriden type, was missing an `extends` constraint which lead to a type error:

  ```
  styled-system/types/global.d.ts:14:58 - error TS2344: Type 'T' does not satisfy the constraint 'PatternProperties'.

  14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                                              ~

    styled-system/types/global.d.ts:14:33
      14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                         ~
      This type parameter might need an `extends PatternProperties` constraint.

  ```

- dc4e80f7: Export `isCssProperty` helper function from styled-system/jsx
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
- Updated dependencies [12c900ee]
- Updated dependencies [5bd88c41]
- Updated dependencies [ef1dd676]
- Updated dependencies [b50675ca]
  - @pandacss/core@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 53fb0708: Fix `config.staticCss` by filtering types on getPropertyKeys

  It used to throw because of them:

  ```bash
  <css input>:33:21: Missed semicolon
   ELIFECYCLE  Command failed with exit code 1.
  ```

  ```css
  @layer utilities {
      .m_type\:Tokens\[\"spacing\"\] {
          margin: type:Tokens["spacing"]
      }
  }
  ```

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
- b8f8c2a6: Fix reset.css (generated when config has `preflight: true`) import order, always place it first so that it
  can be easily overriden
- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/core@0.5.1
  - @pandacss/token-dictionary@0.5.1
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

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/core@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/is-valid-prop@0.5.0
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

- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [2a1e9386]
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/core@0.4.0
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/core@0.3.2
- @pandacss/is-valid-prop@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/core@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/core@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/core@0.0.2
  - @pandacss/is-valid-prop@0.0.2
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

- 49c760cd: Fix issue where responsive array in css and cva doesn't generate the correct classname
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
  - @pandacss/core@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/is-valid-prop@0.30.0

## 0.29.1

### Patch Changes

- Updated dependencies [a5c75607]
  - @pandacss/core@0.29.1
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
  - @pandacss/types@0.29.1

## 0.29.0

### Minor Changes

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

### Patch Changes

- 2e32794d: Set `display: none` for hidden elements in `reset` css
- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [f778d3e5]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/core@0.29.0
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

- 1edadf30: Fix issue where `/* @__PURE__ */` annotation threw a warning in Vite build due to incorrect placement.
- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [e463ce0e]
- Updated dependencies [77cab9fe]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
- Updated dependencies [9d000dcd]
- Updated dependencies [6d7e7b07]
  - @pandacss/types@0.28.0
  - @pandacss/core@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/core@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/core@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/core@0.27.1
  - @pandacss/token-dictionary@0.27.1
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

- dce0b3b2: Enhance `splitCssProps` typings
- 74ac0d9d: Improve the performance of the runtime transform functions by caching their results (css, cva, sva,
  recipe/slot recipe, patterns)

  > See detailed breakdown of the performance improvements
  > [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

- Updated dependencies [84304901]
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0
  - @pandacss/core@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/core@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- 6de4c737: Hotfix `strictTokens` after introducing `strictPropertyValues`
  - @pandacss/core@0.26.1
  - @pandacss/is-valid-prop@0.26.1
  - @pandacss/logger@0.26.1
  - @pandacss/shared@0.26.1
  - @pandacss/token-dictionary@0.26.1
  - @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- a179d74f: tl;dr:

  - `config.strictTokens` will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`,
    etc.
  - `config.strictPropertyValues` is added and will throw for properties that do not have config tokens, such as
    `display`, `content`, `willChange`, etc. when the value is not a predefined CSS value.

  ***

  In version
  [0.19.0 we changed `config.strictTokens`](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0190---2023-11-24)
  typings a bit so that the only property values allowed were the config tokens OR the predefined CSS values, ex: `flex`
  for the property `display`, which prevented typos such as `display: 'aaa'`.

  The problem with this change is that it means you would have to provide every CSS properties a given set of values so
  that TS wouldn't throw any error. Thus, we will partly revert this change and make it so that `config.strictTokens`
  shouldn't affect properties that do not have config tokens, such as `content`, `willChange`, `display`, etc.

  v0.19.0:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ would throw since 'abc' is not part of predefined values of 'display' even thought there is no config token for 'abc'
  ```

  now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will not throw there is no config token for 'abc'
  ```

  Instead, if you want the v.19.0 behavior, you can use the new `config.strictPropertyValues` option. You can combine it
  with `config.strictTokens` if you want to be strict on both properties with config tokens and properties without
  config tokens.

  The new `config.strictPropertyValues` option will only be applied to this exhaustive list of properties:

  ```ts
  type StrictableProps =
    | "alignContent"
    | "alignItems"
    | "alignSelf"
    | "all"
    | "animationComposition"
    | "animationDirection"
    | "animationFillMode"
    | "appearance"
    | "backfaceVisibility"
    | "backgroundAttachment"
    | "backgroundClip"
    | "borderCollapse"
    | "border"
    | "borderBlock"
    | "borderBlockEnd"
    | "borderBlockStart"
    | "borderBottom"
    | "borderInline"
    | "borderInlineEnd"
    | "borderInlineStart"
    | "borderLeft"
    | "borderRight"
    | "borderTop"
    | "borderBlockEndStyle"
    | "borderBlockStartStyle"
    | "borderBlockStyle"
    | "borderBottomStyle"
    | "borderInlineEndStyle"
    | "borderInlineStartStyle"
    | "borderInlineStyle"
    | "borderLeftStyle"
    | "borderRightStyle"
    | "borderTopStyle"
    | "boxDecorationBreak"
    | "boxSizing"
    | "breakAfter"
    | "breakBefore"
    | "breakInside"
    | "captionSide"
    | "clear"
    | "columnFill"
    | "columnRuleStyle"
    | "contentVisibility"
    | "direction"
    | "display"
    | "emptyCells"
    | "flexDirection"
    | "flexWrap"
    | "float"
    | "fontKerning"
    | "forcedColorAdjust"
    | "isolation"
    | "lineBreak"
    | "mixBlendMode"
    | "objectFit"
    | "outlineStyle"
    | "overflow"
    | "overflowX"
    | "overflowY"
    | "overflowBlock"
    | "overflowInline"
    | "overflowWrap"
    | "pointerEvents"
    | "position"
    | "resize"
    | "scrollBehavior"
    | "touchAction"
    | "transformBox"
    | "transformStyle"
    | "userSelect"
    | "visibility"
    | "wordBreak"
    | "writingMode";
  ```

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [14033e00]
- Updated dependencies [d420c676]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/core@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/core@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
- Updated dependencies [61ebf3d2]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/core@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- 10e74428: - Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS
  wasn't applied correctly
  - Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
    through the config recipes)
  - @pandacss/core@0.24.1
  - @pandacss/is-valid-prop@0.24.1
  - @pandacss/logger@0.24.1
  - @pandacss/shared@0.24.1
  - @pandacss/token-dictionary@0.24.1
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

- Updated dependencies [63b3f1f2]
- Updated dependencies [f6881022]
  - @pandacss/core@0.24.0
  - @pandacss/types@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- d30b1737: Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal`
  or `none` with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- a3b6ed5f: Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal
  parsing when not using `config.syntax` set to "template-literal"
- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [1ea7459c]
- Updated dependencies [80ada336]
- Updated dependencies [bd552b1f]
- Updated dependencies [840ed66b]
  - @pandacss/core@0.23.0
  - @pandacss/logger@0.23.0
  - @pandacss/is-valid-prop@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 8f4ce97c: Fix `slotRecipes` typings,
  [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added to `config.recipes`
  weren't added to `config.slotRecipes`
- 647f05c9: Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

  ```ts
  css({
    bg: "[#3B00B9]", // ✅ was okay
    _dark: {
      // ✅ was okay
      color: "[#3B00B9]",
    },

    // ❌ Not okay, will be fixed in this patch
    color: {
      _dark: "[#3B00B9]",
    },
  });
  ```

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
  - @pandacss/core@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- e83afef0: Update csstype to support newer css features

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties
- 9c0d3f8f: Fix regression where `styled-system/jsx/index` had the wrong exports
- c95c40bd: Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [11753fea]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/core@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/is-valid-prop@0.22.0
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

- 052283c2: Fix vue `styled` factory internal class merging, for example:

  ```vue
  <script setup>
  import { styled } from "../styled-system/jsx";

  const StyledButton = styled("button", {
    base: {
      bgColor: "red.300",
    },
  });
  </script>
  <template>
    <StyledButton id="test" class="test">
      <slot></slot>
    </StyledButton>
  </template>
  ```

  Will now correctly include the `test` class in the final output.

- Updated dependencies [788aaba3]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [d81dcbe6]
- Updated dependencies [105f74ce]
  - @pandacss/core@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/core@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/is-valid-prop@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- e4fdc64a: Fix issue where conditional recipe variant doesn't work as expected
- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [4ba982f3]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/core@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 61831040: Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.

  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)

- 92a7fbe5: Fix issue in preflight where monospace fallback pointed to the wrong variable
- 89f86923: Fix issue where css variables were not supported in layer styles and text styles types.
- 402afbee: Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for
  the property 'display') and throwing when using anything else than those, if no theme tokens was found on that
  property.

  Before:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ didn't throw even though 'abc' is not a valid value for 'display'
  ```

  Now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will throw since 'abc' is not a valid value for 'display'
  ```

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
- Updated dependencies [9f5711f9]
  - @pandacss/types@0.19.0
  - @pandacss/core@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- 78b940b2: Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
  - @pandacss/core@0.18.3
  - @pandacss/is-valid-prop@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/core@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
- Updated dependencies [8c76cd0f]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/core@0.18.1
  - @pandacss/is-valid-prop@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Minor Changes

- b7cb2073: Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

  ```tsx
  import { splitCssProps, styled } from "../styled-system/jsx";
  import type { HTMLStyledProps } from "../styled-system/types";

  function SplitComponent({ children, ...props }: HTMLStyledProps<"div">) {
    const [cssProps, restProps] = splitCssProps(props);
    return (
      <styled.div
        {...restProps}
        className={css(
          { display: "flex", height: "20", width: "20" },
          cssProps,
        )}
      >
        {children}
      </styled.div>
    );
  }

  // Usage

  function App() {
    return <SplitComponent margin="2">Click me</SplitComponent>;
  }
  ```

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/core@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- 6718f81b: Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- 3ce70c37: Fix issue where cva composition in styled components doens't work as expected.
- Updated dependencies [a6dfc944]
  - @pandacss/core@0.17.5
  - @pandacss/is-valid-prop@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/core@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/core@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/core@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 296d62b1: Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`

  Fixes https://github.com/chakra-ui/panda/issues/1549

- 42520626: Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- 9382e687: remove export types from jsx when no jsxFramework configuration
- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM
- Updated dependencies [aea28c9f]
- Updated dependencies [5ce359f6]
  - @pandacss/core@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

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

- fbf062c6: Added a new type to extract variants out of styled components

  ```tsx
  import { StyledVariantProps } from "../styled-system/jsx";

  const Button = styled("button", {
    base: { color: "black" },
    variants: {
      state: {
        error: { color: "red" },
        success: { color: "green" },
      },
    },
  });

  type ButtonVariantProps = StyledVariantProps<typeof Button>;
  //   ^ { state?: 'error' | 'success' | undefined }
  ```

### Patch Changes

- 93996aaf: Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`
- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [e73ea803]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/core@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/is-valid-prop@0.17.0
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

- 2b5cbf73: correct typings for Qwik components
- Updated dependencies [20f4e204]
  - @pandacss/core@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/is-valid-prop@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- d12aed2b: Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- 909fcbe8: - Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
- 3d5971e5: - **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events
  to the underlying element.
  - **Vue**: Fix regression in generated types
  - **Preact**: Fix regression in generated types
  - @pandacss/core@0.15.5
  - @pandacss/is-valid-prop@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
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

  - @pandacss/types@0.15.4
  - @pandacss/core@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- d34c8b48: Fix issue where HMR does not work for Vue JSX factory and patterns
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

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: "btn",
    base: { color: "green", fontSize: "16px" },
    variants: {
      size: { small: { fontSize: "14px" } },
    },
    compoundVariants: [{ size: "small", css: { color: "blue" } }],
  });
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button);

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    );
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/core@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 6d15776c: When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`).
  Sometimes TS will complain about types not being exported.

  - Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

  ```
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
  ```

  - Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

  ```
  src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
  src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
  src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
  ```

  - Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

  ```
   "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
  ```

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/core@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- 433f88cd: Fix issue in css reset where number input field spinner still show.
- 7499bbd2: Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Updated dependencies [848936e0]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/core@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- 93d9ee7e: Refactor: Prefer `NativeElements` type for vue jsx elements
- 35793d85: Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()`
  with `const button = cva({ ... })`)
- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [bc3b077d]
- Updated dependencies [39298609]
- Updated dependencies [dd47b6e6]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/core@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bdd30d18: Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6548f4f7: Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The
  inferred type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 542d1ebc: Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it.

  This is mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would
  use it like `css({ ... }, cssProps)`

- 39b20797: Change the `css.raw` function signature to match the one from
  [`css()`](https://github.com/chakra-ui/panda/pull/1264), to allow passing multiple style objects that will be smartly
  merged.
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
- Updated dependencies [02161d41]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/core@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- 192d5e49: Fix issue where `cva` is undefined in preact styled factory
  - @pandacss/core@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- a9690110: Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme`
  type.
- 32ceac3f: Fix an issue with custom JSX components not finding their matching patterns
- Updated dependencies [04b5fd6c]
  - @pandacss/core@0.13.0
  - @pandacss/is-valid-prop@0.13.0
  - @pandacss/logger@0.13.0
  - @pandacss/shared@0.13.0
  - @pandacss/token-dictionary@0.13.0
  - @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- 6588c8e0: - Change the `css` function signature to allow passing multiple style objects that will be smartly merged.

  - Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
  - Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments
    passed in. This is to allow the `css` function to merge the styles correctly.

  ```tsx
  import { css } from "../styled-system/css";
  css({ mx: "3", paddingTop: "4" }, { mx: "10", pt: "6" }); // => mx_10 pt_6
  ```

  > ⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to
  > its original classname concatenation behaviour.

  ```diff
  import { css, cx } from '../styled-system/css'

  const App = () => {
    return (
      <>
  -      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
  +      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
          Will result in `class="mx_10 pt_6"`
        </div>
      </>
    )
  }
  ```

  To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

  ```tsx title="src/components/Button.tsx"
  import { css } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      { display: "flex", alignItem: "center", color: "black" },
      cssProp,
    );
    return <button className={className}>{children}</button>;
  };
  ```

  Then you can use the `Button` component like this:

  ```tsx title="src/app/page.tsx"
  import { css } from "../../styled-system/css";
  import { Button, Thingy } from "./Button";

  export default function Page() {
    return (
      <Button css={{ color: "pink", _hover: { color: "red" } }}>
        will result in `class="d_flex items_center text_pink hover:text_red"`
      </Button>
    );
  }
  ```

  ***

  You can use this approach as well with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects
  to be merged as expected in any situation.

  **Pattern Example:**

  ```tsx title="src/components/Button.tsx"
  import { hstack } from "../../styled-system/patterns";
  import { css, cva } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    // using the flex pattern
    const hstackProps = hstack.raw({
      border: "1px solid",
      _hover: { color: "blue.400" },
    });

    // merging the styles
    const className = css(hstackProps, cssProp);

    return <button className={className}>{children}</button>;
  };
  ```

  **CVA Example:**

  ```tsx title="src/components/Button.tsx"
  import { css, cva } from "../../styled-system/css";

  const buttonRecipe = cva({
    base: { display: "flex", fontSize: "lg" },
    variants: {
      variant: {
        primary: { color: "white", backgroundColor: "blue.500" },
      },
    },
  });

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      // using the button recipe
      buttonRecipe.raw({ variant: "primary" }),

      // adding style overrides (internal)
      { _hover: { color: "blue.400" } },

      // adding style overrides (external)
      cssProp,
    );

    return <button className={className}>{props.children}</button>;
  };
  ```

- 36fdff89: Fix bug in generated js code for atomic slot recipe produce where `splitVariantProps` didn't work without
  the first slot key.
  - @pandacss/core@0.12.2
  - @pandacss/is-valid-prop@0.12.2
  - @pandacss/logger@0.12.2
  - @pandacss/shared@0.12.2
  - @pandacss/token-dictionary@0.12.2
  - @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- 599fbc1a: Fix issue where `AnimationName` type was generated wrongly if keyframes were not resolved
  - @pandacss/core@0.12.1
  - @pandacss/is-valid-prop@0.12.1
  - @pandacss/logger@0.12.1
  - @pandacss/shared@0.12.1
  - @pandacss/token-dictionary@0.12.1
  - @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- a41515de: Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- bf2ff391: Add `animationName` utility
- ad1518b8: fix failed styled component for solid-js when using recipe
  - @pandacss/core@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/is-valid-prop@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

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

- dfb3f85f: Add missing svg props types
- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/core@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- 5b95caf5: Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook)
  dependency
- 39b80b49: Fix an issue with the runtime className generation when using an utility that maps to multiple shorthands
- 1dc788bd: Fix issue where some style properties shows TS error when using `!important`
- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/core@0.11.0
  - @pandacss/token-dictionary@0.11.0
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

- 24e783b3: Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and
  further reduce it.

  `config.jsxStyleProps`:

  - When set to 'all', all style props are allowed.
  - When set to 'minimal', only the `css` prop is allowed.
  - When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
    - `<styled.div />` and `styled("div")` aren't valid
    - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- 386e5098: Update `RecipeVariantProps` to support slot recipes
- 6d4eaa68: Refactor code
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [2d2a42da]
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/core@0.10.0
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
  - @pandacss/core@0.9.0
  - @pandacss/token-dictionary@0.9.0
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

- 3f1e7e32: Adds the `{recipe}.raw()` in generated runtime
- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- be0ad578: Fix parser issue with TS path mappings
- b75905d8: Improve generated react jsx types to remove legacy ref. This fixes type composition issues.
- 0520ba83: Refactor generated recipe js code
- 156b6bde: Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`
- Updated dependencies [fb449016]
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/core@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- a9c189b7: Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/core@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- cd912f35: Fix `definePattern` module overriden type, was missing an `extends` constraint which lead to a type error:

  ```
  styled-system/types/global.d.ts:14:58 - error TS2344: Type 'T' does not satisfy the constraint 'PatternProperties'.

  14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                                              ~

    styled-system/types/global.d.ts:14:33
      14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                         ~
      This type parameter might need an `extends PatternProperties` constraint.

  ```

- dc4e80f7: Export `isCssProperty` helper function from styled-system/jsx
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
- Updated dependencies [12c900ee]
- Updated dependencies [5bd88c41]
- Updated dependencies [ef1dd676]
- Updated dependencies [b50675ca]
  - @pandacss/core@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 53fb0708: Fix `config.staticCss` by filtering types on getPropertyKeys

  It used to throw because of them:

  ```bash
  <css input>:33:21: Missed semicolon
   ELIFECYCLE  Command failed with exit code 1.
  ```

  ```css
  @layer utilities {
      .m_type\:Tokens\[\"spacing\"\] {
          margin: type:Tokens["spacing"]
      }
  }
  ```

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
- b8f8c2a6: Fix reset.css (generated when config has `preflight: true`) import order, always place it first so that it
  can be easily overriden
- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/core@0.5.1
  - @pandacss/token-dictionary@0.5.1
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

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/core@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/is-valid-prop@0.5.0
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

- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [2a1e9386]
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/core@0.4.0
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/core@0.3.2
- @pandacss/is-valid-prop@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/core@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/core@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/core@0.0.2
  - @pandacss/is-valid-prop@0.0.2
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

- 5a205e7: Fix conditions accessing `Cannot read properties of undefined (reading 'raw')`
- Updated dependencies [34d94cf]
- Updated dependencies [4736057]
- Updated dependencies [e855c64]
- Updated dependencies [5a205e7]
- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/token-dictionary@0.33.0
  - @pandacss/core@0.33.0
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

- Updated dependencies [a032375]
- Updated dependencies [31071ba]
- Updated dependencies [5184771]
- Updated dependencies [f419993]
- Updated dependencies [6d8c884]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1
  - @pandacss/core@0.32.1
  - @pandacss/token-dictionary@0.32.1
  - @pandacss/logger@0.32.1
  - @pandacss/is-valid-prop@0.32.1
  - @pandacss/shared@0.32.1

## 0.32.0

### Minor Changes

- b32d817: Switch from `em` to `rem` for breakpoints and container queries to prevent side effects.

### Patch Changes

- 60cace3: This change allows the user to set `jsxFramework` to any string to enable extracting JSX components.

  ***

  Context: In a previous version, Panda's extractor used to always extract JSX style props even when not specifying a
  `jsxFramework`. This was considered a bug and has been fixed, which reduced the amount of work panda does and
  artifacts generated if the user doesn't need jsx.

  Now, in some cases like when using Svelte or Astro, the user might still to use & extract JSX style props, but the
  `jsxFramework` didn't have a way to specify that. This change allows the user to set `jsxFramework` to any string to
  enable extracting JSX components without generating any artifacts.

- Updated dependencies [433a364]
- Updated dependencies [8cd8c19]
- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
- Updated dependencies [b32d817]
  - @pandacss/core@0.32.0
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

### Patch Changes

- 8f36f9af: Add a `RecipeVariant` type to get the variants in a strict object from `cva` function. This complements the
  `RecipeVariantprops` type that extracts the variant as optional props, mostly intended for JSX components.
- 2d69b340: Fix `styled` factory nested composition with `cva`
- Updated dependencies [8f36f9af]
- Updated dependencies [f0296249]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0
  - @pandacss/shared@0.31.0
  - @pandacss/core@0.31.0
  - @pandacss/logger@0.31.0
  - @pandacss/token-dictionary@0.31.0
  - @pandacss/is-valid-prop@0.31.0

## 0.30.2

### Patch Changes

- 97efdb43: Fix issue where `v-model` does not work in vue styled factory
- 7233cd2e: Fix issue where styled factory in Solid.js could results in `Maximum call stack exceeded` when composing
  with another library that uses the `as` prop.
- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2
  - @pandacss/core@0.30.2
  - @pandacss/logger@0.30.2
  - @pandacss/token-dictionary@0.30.2
  - @pandacss/is-valid-prop@0.30.2
  - @pandacss/shared@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/core@0.30.1
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

- Updated dependencies [a5c75607]
  - @pandacss/core@0.29.1
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
  - @pandacss/types@0.29.1

## 0.29.0

### Minor Changes

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

### Patch Changes

- 2e32794d: Set `display: none` for hidden elements in `reset` css
- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [f778d3e5]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/core@0.29.0
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

- 1edadf30: Fix issue where `/* @__PURE__ */` annotation threw a warning in Vite build due to incorrect placement.
- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [e463ce0e]
- Updated dependencies [77cab9fe]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
- Updated dependencies [9d000dcd]
- Updated dependencies [6d7e7b07]
  - @pandacss/types@0.28.0
  - @pandacss/core@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/core@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/core@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/core@0.27.1
  - @pandacss/token-dictionary@0.27.1
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

- dce0b3b2: Enhance `splitCssProps` typings
- 74ac0d9d: Improve the performance of the runtime transform functions by caching their results (css, cva, sva,
  recipe/slot recipe, patterns)

  > See detailed breakdown of the performance improvements
  > [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

- Updated dependencies [84304901]
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0
  - @pandacss/core@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/core@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- 6de4c737: Hotfix `strictTokens` after introducing `strictPropertyValues`
  - @pandacss/core@0.26.1
  - @pandacss/is-valid-prop@0.26.1
  - @pandacss/logger@0.26.1
  - @pandacss/shared@0.26.1
  - @pandacss/token-dictionary@0.26.1
  - @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- a179d74f: tl;dr:

  - `config.strictTokens` will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`,
    etc.
  - `config.strictPropertyValues` is added and will throw for properties that do not have config tokens, such as
    `display`, `content`, `willChange`, etc. when the value is not a predefined CSS value.

  ***

  In version
  [0.19.0 we changed `config.strictTokens`](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0190---2023-11-24)
  typings a bit so that the only property values allowed were the config tokens OR the predefined CSS values, ex: `flex`
  for the property `display`, which prevented typos such as `display: 'aaa'`.

  The problem with this change is that it means you would have to provide every CSS properties a given set of values so
  that TS wouldn't throw any error. Thus, we will partly revert this change and make it so that `config.strictTokens`
  shouldn't affect properties that do not have config tokens, such as `content`, `willChange`, `display`, etc.

  v0.19.0:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ would throw since 'abc' is not part of predefined values of 'display' even thought there is no config token for 'abc'
  ```

  now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will not throw there is no config token for 'abc'
  ```

  Instead, if you want the v.19.0 behavior, you can use the new `config.strictPropertyValues` option. You can combine it
  with `config.strictTokens` if you want to be strict on both properties with config tokens and properties without
  config tokens.

  The new `config.strictPropertyValues` option will only be applied to this exhaustive list of properties:

  ```ts
  type StrictableProps =
    | "alignContent"
    | "alignItems"
    | "alignSelf"
    | "all"
    | "animationComposition"
    | "animationDirection"
    | "animationFillMode"
    | "appearance"
    | "backfaceVisibility"
    | "backgroundAttachment"
    | "backgroundClip"
    | "borderCollapse"
    | "border"
    | "borderBlock"
    | "borderBlockEnd"
    | "borderBlockStart"
    | "borderBottom"
    | "borderInline"
    | "borderInlineEnd"
    | "borderInlineStart"
    | "borderLeft"
    | "borderRight"
    | "borderTop"
    | "borderBlockEndStyle"
    | "borderBlockStartStyle"
    | "borderBlockStyle"
    | "borderBottomStyle"
    | "borderInlineEndStyle"
    | "borderInlineStartStyle"
    | "borderInlineStyle"
    | "borderLeftStyle"
    | "borderRightStyle"
    | "borderTopStyle"
    | "boxDecorationBreak"
    | "boxSizing"
    | "breakAfter"
    | "breakBefore"
    | "breakInside"
    | "captionSide"
    | "clear"
    | "columnFill"
    | "columnRuleStyle"
    | "contentVisibility"
    | "direction"
    | "display"
    | "emptyCells"
    | "flexDirection"
    | "flexWrap"
    | "float"
    | "fontKerning"
    | "forcedColorAdjust"
    | "isolation"
    | "lineBreak"
    | "mixBlendMode"
    | "objectFit"
    | "outlineStyle"
    | "overflow"
    | "overflowX"
    | "overflowY"
    | "overflowBlock"
    | "overflowInline"
    | "overflowWrap"
    | "pointerEvents"
    | "position"
    | "resize"
    | "scrollBehavior"
    | "touchAction"
    | "transformBox"
    | "transformStyle"
    | "userSelect"
    | "visibility"
    | "wordBreak"
    | "writingMode";
  ```

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [14033e00]
- Updated dependencies [d420c676]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/core@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/core@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
- Updated dependencies [61ebf3d2]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/core@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- 10e74428: - Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS
  wasn't applied correctly
  - Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
    through the config recipes)
  - @pandacss/core@0.24.1
  - @pandacss/is-valid-prop@0.24.1
  - @pandacss/logger@0.24.1
  - @pandacss/shared@0.24.1
  - @pandacss/token-dictionary@0.24.1
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

- Updated dependencies [63b3f1f2]
- Updated dependencies [f6881022]
  - @pandacss/core@0.24.0
  - @pandacss/types@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- d30b1737: Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal`
  or `none` with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- a3b6ed5f: Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal
  parsing when not using `config.syntax` set to "template-literal"
- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [1ea7459c]
- Updated dependencies [80ada336]
- Updated dependencies [bd552b1f]
- Updated dependencies [840ed66b]
  - @pandacss/core@0.23.0
  - @pandacss/logger@0.23.0
  - @pandacss/is-valid-prop@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 8f4ce97c: Fix `slotRecipes` typings,
  [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added to `config.recipes`
  weren't added to `config.slotRecipes`
- 647f05c9: Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

  ```ts
  css({
    bg: "[#3B00B9]", // ✅ was okay
    _dark: {
      // ✅ was okay
      color: "[#3B00B9]",
    },

    // ❌ Not okay, will be fixed in this patch
    color: {
      _dark: "[#3B00B9]",
    },
  });
  ```

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
  - @pandacss/core@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- e83afef0: Update csstype to support newer css features

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties
- 9c0d3f8f: Fix regression where `styled-system/jsx/index` had the wrong exports
- c95c40bd: Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [11753fea]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/core@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/is-valid-prop@0.22.0
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

- 052283c2: Fix vue `styled` factory internal class merging, for example:

  ```vue
  <script setup>
  import { styled } from "../styled-system/jsx";

  const StyledButton = styled("button", {
    base: {
      bgColor: "red.300",
    },
  });
  </script>
  <template>
    <StyledButton id="test" class="test">
      <slot></slot>
    </StyledButton>
  </template>
  ```

  Will now correctly include the `test` class in the final output.

- Updated dependencies [788aaba3]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [d81dcbe6]
- Updated dependencies [105f74ce]
  - @pandacss/core@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/core@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/is-valid-prop@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- e4fdc64a: Fix issue where conditional recipe variant doesn't work as expected
- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [4ba982f3]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/core@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 61831040: Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.

  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)

- 92a7fbe5: Fix issue in preflight where monospace fallback pointed to the wrong variable
- 89f86923: Fix issue where css variables were not supported in layer styles and text styles types.
- 402afbee: Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for
  the property 'display') and throwing when using anything else than those, if no theme tokens was found on that
  property.

  Before:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ didn't throw even though 'abc' is not a valid value for 'display'
  ```

  Now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will throw since 'abc' is not a valid value for 'display'
  ```

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
- Updated dependencies [9f5711f9]
  - @pandacss/types@0.19.0
  - @pandacss/core@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- 78b940b2: Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
  - @pandacss/core@0.18.3
  - @pandacss/is-valid-prop@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/core@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
- Updated dependencies [8c76cd0f]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/core@0.18.1
  - @pandacss/is-valid-prop@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Minor Changes

- b7cb2073: Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

  ```tsx
  import { splitCssProps, styled } from "../styled-system/jsx";
  import type { HTMLStyledProps } from "../styled-system/types";

  function SplitComponent({ children, ...props }: HTMLStyledProps<"div">) {
    const [cssProps, restProps] = splitCssProps(props);
    return (
      <styled.div
        {...restProps}
        className={css(
          { display: "flex", height: "20", width: "20" },
          cssProps,
        )}
      >
        {children}
      </styled.div>
    );
  }

  // Usage

  function App() {
    return <SplitComponent margin="2">Click me</SplitComponent>;
  }
  ```

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/core@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- 6718f81b: Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- 3ce70c37: Fix issue where cva composition in styled components doens't work as expected.
- Updated dependencies [a6dfc944]
  - @pandacss/core@0.17.5
  - @pandacss/is-valid-prop@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/core@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/core@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/core@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 296d62b1: Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`

  Fixes https://github.com/chakra-ui/panda/issues/1549

- 42520626: Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- 9382e687: remove export types from jsx when no jsxFramework configuration
- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM
- Updated dependencies [aea28c9f]
- Updated dependencies [5ce359f6]
  - @pandacss/core@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

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

- fbf062c6: Added a new type to extract variants out of styled components

  ```tsx
  import { StyledVariantProps } from "../styled-system/jsx";

  const Button = styled("button", {
    base: { color: "black" },
    variants: {
      state: {
        error: { color: "red" },
        success: { color: "green" },
      },
    },
  });

  type ButtonVariantProps = StyledVariantProps<typeof Button>;
  //   ^ { state?: 'error' | 'success' | undefined }
  ```

### Patch Changes

- 93996aaf: Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`
- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [e73ea803]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/core@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/is-valid-prop@0.17.0
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

- 2b5cbf73: correct typings for Qwik components
- Updated dependencies [20f4e204]
  - @pandacss/core@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/is-valid-prop@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- d12aed2b: Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- 909fcbe8: - Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
- 3d5971e5: - **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events
  to the underlying element.
  - **Vue**: Fix regression in generated types
  - **Preact**: Fix regression in generated types
  - @pandacss/core@0.15.5
  - @pandacss/is-valid-prop@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
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

  - @pandacss/types@0.15.4
  - @pandacss/core@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- d34c8b48: Fix issue where HMR does not work for Vue JSX factory and patterns
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

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: "btn",
    base: { color: "green", fontSize: "16px" },
    variants: {
      size: { small: { fontSize: "14px" } },
    },
    compoundVariants: [{ size: "small", css: { color: "blue" } }],
  });
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button);

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    );
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/core@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 6d15776c: When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`).
  Sometimes TS will complain about types not being exported.

  - Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

  ```
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
  ```

  - Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

  ```
  src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
  src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
  src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
  ```

  - Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

  ```
   "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
  ```

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/core@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- 433f88cd: Fix issue in css reset where number input field spinner still show.
- 7499bbd2: Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Updated dependencies [848936e0]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/core@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- 93d9ee7e: Refactor: Prefer `NativeElements` type for vue jsx elements
- 35793d85: Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()`
  with `const button = cva({ ... })`)
- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [bc3b077d]
- Updated dependencies [39298609]
- Updated dependencies [dd47b6e6]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/core@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bdd30d18: Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6548f4f7: Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The
  inferred type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 542d1ebc: Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it.

  This is mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would
  use it like `css({ ... }, cssProps)`

- 39b20797: Change the `css.raw` function signature to match the one from
  [`css()`](https://github.com/chakra-ui/panda/pull/1264), to allow passing multiple style objects that will be smartly
  merged.
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
- Updated dependencies [02161d41]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/core@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- 192d5e49: Fix issue where `cva` is undefined in preact styled factory
  - @pandacss/core@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- a9690110: Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme`
  type.
- 32ceac3f: Fix an issue with custom JSX components not finding their matching patterns
- Updated dependencies [04b5fd6c]
  - @pandacss/core@0.13.0
  - @pandacss/is-valid-prop@0.13.0
  - @pandacss/logger@0.13.0
  - @pandacss/shared@0.13.0
  - @pandacss/token-dictionary@0.13.0
  - @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- 6588c8e0: - Change the `css` function signature to allow passing multiple style objects that will be smartly merged.

  - Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
  - Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments
    passed in. This is to allow the `css` function to merge the styles correctly.

  ```tsx
  import { css } from "../styled-system/css";
  css({ mx: "3", paddingTop: "4" }, { mx: "10", pt: "6" }); // => mx_10 pt_6
  ```

  > ⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to
  > its original classname concatenation behaviour.

  ```diff
  import { css, cx } from '../styled-system/css'

  const App = () => {
    return (
      <>
  -      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
  +      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
          Will result in `class="mx_10 pt_6"`
        </div>
      </>
    )
  }
  ```

  To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

  ```tsx title="src/components/Button.tsx"
  import { css } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      { display: "flex", alignItem: "center", color: "black" },
      cssProp,
    );
    return <button className={className}>{children}</button>;
  };
  ```

  Then you can use the `Button` component like this:

  ```tsx title="src/app/page.tsx"
  import { css } from "../../styled-system/css";
  import { Button, Thingy } from "./Button";

  export default function Page() {
    return (
      <Button css={{ color: "pink", _hover: { color: "red" } }}>
        will result in `class="d_flex items_center text_pink hover:text_red"`
      </Button>
    );
  }
  ```

  ***

  You can use this approach as well with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects
  to be merged as expected in any situation.

  **Pattern Example:**

  ```tsx title="src/components/Button.tsx"
  import { hstack } from "../../styled-system/patterns";
  import { css, cva } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    // using the flex pattern
    const hstackProps = hstack.raw({
      border: "1px solid",
      _hover: { color: "blue.400" },
    });

    // merging the styles
    const className = css(hstackProps, cssProp);

    return <button className={className}>{children}</button>;
  };
  ```

  **CVA Example:**

  ```tsx title="src/components/Button.tsx"
  import { css, cva } from "../../styled-system/css";

  const buttonRecipe = cva({
    base: { display: "flex", fontSize: "lg" },
    variants: {
      variant: {
        primary: { color: "white", backgroundColor: "blue.500" },
      },
    },
  });

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      // using the button recipe
      buttonRecipe.raw({ variant: "primary" }),

      // adding style overrides (internal)
      { _hover: { color: "blue.400" } },

      // adding style overrides (external)
      cssProp,
    );

    return <button className={className}>{props.children}</button>;
  };
  ```

- 36fdff89: Fix bug in generated js code for atomic slot recipe produce where `splitVariantProps` didn't work without
  the first slot key.
  - @pandacss/core@0.12.2
  - @pandacss/is-valid-prop@0.12.2
  - @pandacss/logger@0.12.2
  - @pandacss/shared@0.12.2
  - @pandacss/token-dictionary@0.12.2
  - @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- 599fbc1a: Fix issue where `AnimationName` type was generated wrongly if keyframes were not resolved
  - @pandacss/core@0.12.1
  - @pandacss/is-valid-prop@0.12.1
  - @pandacss/logger@0.12.1
  - @pandacss/shared@0.12.1
  - @pandacss/token-dictionary@0.12.1
  - @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- a41515de: Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- bf2ff391: Add `animationName` utility
- ad1518b8: fix failed styled component for solid-js when using recipe
  - @pandacss/core@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/is-valid-prop@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

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

- dfb3f85f: Add missing svg props types
- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/core@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- 5b95caf5: Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook)
  dependency
- 39b80b49: Fix an issue with the runtime className generation when using an utility that maps to multiple shorthands
- 1dc788bd: Fix issue where some style properties shows TS error when using `!important`
- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/core@0.11.0
  - @pandacss/token-dictionary@0.11.0
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

- 24e783b3: Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and
  further reduce it.

  `config.jsxStyleProps`:

  - When set to 'all', all style props are allowed.
  - When set to 'minimal', only the `css` prop is allowed.
  - When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
    - `<styled.div />` and `styled("div")` aren't valid
    - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- 386e5098: Update `RecipeVariantProps` to support slot recipes
- 6d4eaa68: Refactor code
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [2d2a42da]
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/core@0.10.0
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
  - @pandacss/core@0.9.0
  - @pandacss/token-dictionary@0.9.0
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

- 3f1e7e32: Adds the `{recipe}.raw()` in generated runtime
- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- be0ad578: Fix parser issue with TS path mappings
- b75905d8: Improve generated react jsx types to remove legacy ref. This fixes type composition issues.
- 0520ba83: Refactor generated recipe js code
- 156b6bde: Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`
- Updated dependencies [fb449016]
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/core@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- a9c189b7: Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/core@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- cd912f35: Fix `definePattern` module overriden type, was missing an `extends` constraint which lead to a type error:

  ```
  styled-system/types/global.d.ts:14:58 - error TS2344: Type 'T' does not satisfy the constraint 'PatternProperties'.

  14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                                              ~

    styled-system/types/global.d.ts:14:33
      14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                         ~
      This type parameter might need an `extends PatternProperties` constraint.

  ```

- dc4e80f7: Export `isCssProperty` helper function from styled-system/jsx
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
- Updated dependencies [12c900ee]
- Updated dependencies [5bd88c41]
- Updated dependencies [ef1dd676]
- Updated dependencies [b50675ca]
  - @pandacss/core@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 53fb0708: Fix `config.staticCss` by filtering types on getPropertyKeys

  It used to throw because of them:

  ```bash
  <css input>:33:21: Missed semicolon
   ELIFECYCLE  Command failed with exit code 1.
  ```

  ```css
  @layer utilities {
      .m_type\:Tokens\[\"spacing\"\] {
          margin: type:Tokens["spacing"]
      }
  }
  ```

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
- b8f8c2a6: Fix reset.css (generated when config has `preflight: true`) import order, always place it first so that it
  can be easily overriden
- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/core@0.5.1
  - @pandacss/token-dictionary@0.5.1
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

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/core@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/is-valid-prop@0.5.0
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

- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [2a1e9386]
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/core@0.4.0
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/core@0.3.2
- @pandacss/is-valid-prop@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/core@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/core@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/core@0.0.2
  - @pandacss/is-valid-prop@0.0.2
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

- 49c760cd: Fix issue where responsive array in css and cva doesn't generate the correct classname
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
  - @pandacss/core@0.30.0
  - @pandacss/logger@0.30.0
  - @pandacss/is-valid-prop@0.30.0

## 0.29.1

### Patch Changes

- Updated dependencies [a5c75607]
  - @pandacss/core@0.29.1
  - @pandacss/is-valid-prop@0.29.1
  - @pandacss/logger@0.29.1
  - @pandacss/shared@0.29.1
  - @pandacss/token-dictionary@0.29.1
  - @pandacss/types@0.29.1

## 0.29.0

### Minor Changes

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

### Patch Changes

- 2e32794d: Set `display: none` for hidden elements in `reset` css
- Updated dependencies [5fcdeb75]
- Updated dependencies [7c7340ec]
- Updated dependencies [f778d3e5]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0
  - @pandacss/core@0.29.0
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

- 1edadf30: Fix issue where `/* @__PURE__ */` annotation threw a warning in Vite build due to incorrect placement.
- d4fa5de9: Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Updated dependencies [f58f6df2]
- Updated dependencies [e463ce0e]
- Updated dependencies [77cab9fe]
- Updated dependencies [770c7aa4]
- Updated dependencies [d4fa5de9]
- Updated dependencies [9d000dcd]
- Updated dependencies [6d7e7b07]
  - @pandacss/types@0.28.0
  - @pandacss/core@0.28.0
  - @pandacss/shared@0.28.0
  - @pandacss/token-dictionary@0.28.0
  - @pandacss/is-valid-prop@0.28.0
  - @pandacss/logger@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3
  - @pandacss/core@0.27.3
  - @pandacss/token-dictionary@0.27.3
  - @pandacss/is-valid-prop@0.27.3
  - @pandacss/logger@0.27.3
  - @pandacss/shared@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/core@0.27.2
- @pandacss/is-valid-prop@0.27.2
- @pandacss/logger@0.27.2
- @pandacss/shared@0.27.2
- @pandacss/token-dictionary@0.27.2
- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1
  - @pandacss/core@0.27.1
  - @pandacss/token-dictionary@0.27.1
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

- dce0b3b2: Enhance `splitCssProps` typings
- 74ac0d9d: Improve the performance of the runtime transform functions by caching their results (css, cva, sva,
  recipe/slot recipe, patterns)

  > See detailed breakdown of the performance improvements
  > [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

- Updated dependencies [84304901]
- Updated dependencies [bee3ec85]
- Updated dependencies [74ac0d9d]
  - @pandacss/token-dictionary@0.27.0
  - @pandacss/is-valid-prop@0.27.0
  - @pandacss/logger@0.27.0
  - @pandacss/shared@0.27.0
  - @pandacss/types@0.27.0
  - @pandacss/core@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/core@0.26.2
- @pandacss/is-valid-prop@0.26.2
- @pandacss/logger@0.26.2
- @pandacss/shared@0.26.2
- @pandacss/token-dictionary@0.26.2
- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- 6de4c737: Hotfix `strictTokens` after introducing `strictPropertyValues`
  - @pandacss/core@0.26.1
  - @pandacss/is-valid-prop@0.26.1
  - @pandacss/logger@0.26.1
  - @pandacss/shared@0.26.1
  - @pandacss/token-dictionary@0.26.1
  - @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- a179d74f: tl;dr:

  - `config.strictTokens` will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`,
    etc.
  - `config.strictPropertyValues` is added and will throw for properties that do not have config tokens, such as
    `display`, `content`, `willChange`, etc. when the value is not a predefined CSS value.

  ***

  In version
  [0.19.0 we changed `config.strictTokens`](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0190---2023-11-24)
  typings a bit so that the only property values allowed were the config tokens OR the predefined CSS values, ex: `flex`
  for the property `display`, which prevented typos such as `display: 'aaa'`.

  The problem with this change is that it means you would have to provide every CSS properties a given set of values so
  that TS wouldn't throw any error. Thus, we will partly revert this change and make it so that `config.strictTokens`
  shouldn't affect properties that do not have config tokens, such as `content`, `willChange`, `display`, etc.

  v0.19.0:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ would throw since 'abc' is not part of predefined values of 'display' even thought there is no config token for 'abc'
  ```

  now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will not throw there is no config token for 'abc'
  ```

  Instead, if you want the v.19.0 behavior, you can use the new `config.strictPropertyValues` option. You can combine it
  with `config.strictTokens` if you want to be strict on both properties with config tokens and properties without
  config tokens.

  The new `config.strictPropertyValues` option will only be applied to this exhaustive list of properties:

  ```ts
  type StrictableProps =
    | "alignContent"
    | "alignItems"
    | "alignSelf"
    | "all"
    | "animationComposition"
    | "animationDirection"
    | "animationFillMode"
    | "appearance"
    | "backfaceVisibility"
    | "backgroundAttachment"
    | "backgroundClip"
    | "borderCollapse"
    | "border"
    | "borderBlock"
    | "borderBlockEnd"
    | "borderBlockStart"
    | "borderBottom"
    | "borderInline"
    | "borderInlineEnd"
    | "borderInlineStart"
    | "borderLeft"
    | "borderRight"
    | "borderTop"
    | "borderBlockEndStyle"
    | "borderBlockStartStyle"
    | "borderBlockStyle"
    | "borderBottomStyle"
    | "borderInlineEndStyle"
    | "borderInlineStartStyle"
    | "borderInlineStyle"
    | "borderLeftStyle"
    | "borderRightStyle"
    | "borderTopStyle"
    | "boxDecorationBreak"
    | "boxSizing"
    | "breakAfter"
    | "breakBefore"
    | "breakInside"
    | "captionSide"
    | "clear"
    | "columnFill"
    | "columnRuleStyle"
    | "contentVisibility"
    | "direction"
    | "display"
    | "emptyCells"
    | "flexDirection"
    | "flexWrap"
    | "float"
    | "fontKerning"
    | "forcedColorAdjust"
    | "isolation"
    | "lineBreak"
    | "mixBlendMode"
    | "objectFit"
    | "outlineStyle"
    | "overflow"
    | "overflowX"
    | "overflowY"
    | "overflowBlock"
    | "overflowInline"
    | "overflowWrap"
    | "pointerEvents"
    | "position"
    | "resize"
    | "scrollBehavior"
    | "touchAction"
    | "transformBox"
    | "transformStyle"
    | "userSelect"
    | "visibility"
    | "wordBreak"
    | "writingMode";
  ```

- Updated dependencies [657ca5da]
- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
- Updated dependencies [14033e00]
- Updated dependencies [d420c676]
  - @pandacss/shared@0.26.0
  - @pandacss/types@0.26.0
  - @pandacss/core@0.26.0
  - @pandacss/token-dictionary@0.26.0
  - @pandacss/is-valid-prop@0.26.0
  - @pandacss/logger@0.26.0

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/core@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
- Updated dependencies [61ebf3d2]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/core@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- 10e74428: - Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS
  wasn't applied correctly
  - Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
    through the config recipes)
  - @pandacss/core@0.24.1
  - @pandacss/is-valid-prop@0.24.1
  - @pandacss/logger@0.24.1
  - @pandacss/shared@0.24.1
  - @pandacss/token-dictionary@0.24.1
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

- Updated dependencies [63b3f1f2]
- Updated dependencies [f6881022]
  - @pandacss/core@0.24.0
  - @pandacss/types@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- d30b1737: Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal`
  or `none` with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- a3b6ed5f: Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal
  parsing when not using `config.syntax` set to "template-literal"
- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [1ea7459c]
- Updated dependencies [80ada336]
- Updated dependencies [bd552b1f]
- Updated dependencies [840ed66b]
  - @pandacss/core@0.23.0
  - @pandacss/logger@0.23.0
  - @pandacss/is-valid-prop@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 8f4ce97c: Fix `slotRecipes` typings,
  [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added to `config.recipes`
  weren't added to `config.slotRecipes`
- 647f05c9: Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

  ```ts
  css({
    bg: "[#3B00B9]", // ✅ was okay
    _dark: {
      // ✅ was okay
      color: "[#3B00B9]",
    },

    // ❌ Not okay, will be fixed in this patch
    color: {
      _dark: "[#3B00B9]",
    },
  });
  ```

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
  - @pandacss/core@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- e83afef0: Update csstype to support newer css features

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties
- 9c0d3f8f: Fix regression where `styled-system/jsx/index` had the wrong exports
- c95c40bd: Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [11753fea]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/core@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/is-valid-prop@0.22.0
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

- 052283c2: Fix vue `styled` factory internal class merging, for example:

  ```vue
  <script setup>
  import { styled } from "../styled-system/jsx";

  const StyledButton = styled("button", {
    base: {
      bgColor: "red.300",
    },
  });
  </script>
  <template>
    <StyledButton id="test" class="test">
      <slot></slot>
    </StyledButton>
  </template>
  ```

  Will now correctly include the `test` class in the final output.

- Updated dependencies [788aaba3]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [d81dcbe6]
- Updated dependencies [105f74ce]
  - @pandacss/core@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/core@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/is-valid-prop@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- e4fdc64a: Fix issue where conditional recipe variant doesn't work as expected
- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [4ba982f3]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/core@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 61831040: Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.

  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)

- 92a7fbe5: Fix issue in preflight where monospace fallback pointed to the wrong variable
- 89f86923: Fix issue where css variables were not supported in layer styles and text styles types.
- 402afbee: Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for
  the property 'display') and throwing when using anything else than those, if no theme tokens was found on that
  property.

  Before:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ❌ didn't throw even though 'abc' is not a valid value for 'display'
  ```

  Now:

  ```ts
  // config.strictTokens = true
  css({ display: "flex" }); // OK, didn't throw
  css({ display: "block" }); // OK, didn't throw
  css({ display: "abc" }); // ✅ will throw since 'abc' is not a valid value for 'display'
  ```

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
- Updated dependencies [9f5711f9]
  - @pandacss/types@0.19.0
  - @pandacss/core@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- 78b940b2: Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
  - @pandacss/core@0.18.3
  - @pandacss/is-valid-prop@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/core@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
- Updated dependencies [8c76cd0f]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/core@0.18.1
  - @pandacss/is-valid-prop@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Minor Changes

- b7cb2073: Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

  ```tsx
  import { splitCssProps, styled } from "../styled-system/jsx";
  import type { HTMLStyledProps } from "../styled-system/types";

  function SplitComponent({ children, ...props }: HTMLStyledProps<"div">) {
    const [cssProps, restProps] = splitCssProps(props);
    return (
      <styled.div
        {...restProps}
        className={css(
          { display: "flex", height: "20", width: "20" },
          cssProps,
        )}
      >
        {children}
      </styled.div>
    );
  }

  // Usage

  function App() {
    return <SplitComponent margin="2">Click me</SplitComponent>;
  }
  ```

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/core@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- 6718f81b: Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- 3ce70c37: Fix issue where cva composition in styled components doens't work as expected.
- Updated dependencies [a6dfc944]
  - @pandacss/core@0.17.5
  - @pandacss/is-valid-prop@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/core@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/core@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/core@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 296d62b1: Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`

  Fixes https://github.com/chakra-ui/panda/issues/1549

- 42520626: Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- 9382e687: remove export types from jsx when no jsxFramework configuration
- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM
- Updated dependencies [aea28c9f]
- Updated dependencies [5ce359f6]
  - @pandacss/core@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

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

- fbf062c6: Added a new type to extract variants out of styled components

  ```tsx
  import { StyledVariantProps } from "../styled-system/jsx";

  const Button = styled("button", {
    base: { color: "black" },
    variants: {
      state: {
        error: { color: "red" },
        success: { color: "green" },
      },
    },
  });

  type ButtonVariantProps = StyledVariantProps<typeof Button>;
  //   ^ { state?: 'error' | 'success' | undefined }
  ```

### Patch Changes

- 93996aaf: Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`
- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [e73ea803]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/core@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/is-valid-prop@0.17.0
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

- 2b5cbf73: correct typings for Qwik components
- Updated dependencies [20f4e204]
  - @pandacss/core@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/is-valid-prop@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- d12aed2b: Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- 909fcbe8: - Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
- 3d5971e5: - **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events
  to the underlying element.
  - **Vue**: Fix regression in generated types
  - **Preact**: Fix regression in generated types
  - @pandacss/core@0.15.5
  - @pandacss/is-valid-prop@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
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

  - @pandacss/types@0.15.4
  - @pandacss/core@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- d34c8b48: Fix issue where HMR does not work for Vue JSX factory and patterns
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

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: "btn",
    base: { color: "green", fontSize: "16px" },
    variants: {
      size: { small: { fontSize: "14px" } },
    },
    compoundVariants: [{ size: "small", css: { color: "blue" } }],
  });
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from "../styled-system/jsx";
  import { button } from "../styled-system/recipes";

  const Button = styled("button", button);

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    );
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/core@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 6d15776c: When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`).
  Sometimes TS will complain about types not being exported.

  - Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

  ```
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
  ```

  - Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

  ```
  src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
  src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
  src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
  ```

  - Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

  ```
   "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
  ```

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/core@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- 433f88cd: Fix issue in css reset where number input field spinner still show.
- 7499bbd2: Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Updated dependencies [848936e0]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/core@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- 93d9ee7e: Refactor: Prefer `NativeElements` type for vue jsx elements
- 35793d85: Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()`
  with `const button = cva({ ... })`)
- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [bc3b077d]
- Updated dependencies [39298609]
- Updated dependencies [dd47b6e6]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/core@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bdd30d18: Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6548f4f7: Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The
  inferred type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 542d1ebc: Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it.

  This is mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would
  use it like `css({ ... }, cssProps)`

- 39b20797: Change the `css.raw` function signature to match the one from
  [`css()`](https://github.com/chakra-ui/panda/pull/1264), to allow passing multiple style objects that will be smartly
  merged.
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
- Updated dependencies [02161d41]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/core@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- 192d5e49: Fix issue where `cva` is undefined in preact styled factory
  - @pandacss/core@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- a9690110: Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme`
  type.
- 32ceac3f: Fix an issue with custom JSX components not finding their matching patterns
- Updated dependencies [04b5fd6c]
  - @pandacss/core@0.13.0
  - @pandacss/is-valid-prop@0.13.0
  - @pandacss/logger@0.13.0
  - @pandacss/shared@0.13.0
  - @pandacss/token-dictionary@0.13.0
  - @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- 6588c8e0: - Change the `css` function signature to allow passing multiple style objects that will be smartly merged.

  - Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
  - Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments
    passed in. This is to allow the `css` function to merge the styles correctly.

  ```tsx
  import { css } from "../styled-system/css";
  css({ mx: "3", paddingTop: "4" }, { mx: "10", pt: "6" }); // => mx_10 pt_6
  ```

  > ⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to
  > its original classname concatenation behaviour.

  ```diff
  import { css, cx } from '../styled-system/css'

  const App = () => {
    return (
      <>
  -      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
  +      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
          Will result in `class="mx_10 pt_6"`
        </div>
      </>
    )
  }
  ```

  To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

  ```tsx title="src/components/Button.tsx"
  import { css } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      { display: "flex", alignItem: "center", color: "black" },
      cssProp,
    );
    return <button className={className}>{children}</button>;
  };
  ```

  Then you can use the `Button` component like this:

  ```tsx title="src/app/page.tsx"
  import { css } from "../../styled-system/css";
  import { Button, Thingy } from "./Button";

  export default function Page() {
    return (
      <Button css={{ color: "pink", _hover: { color: "red" } }}>
        will result in `class="d_flex items_center text_pink hover:text_red"`
      </Button>
    );
  }
  ```

  ***

  You can use this approach as well with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects
  to be merged as expected in any situation.

  **Pattern Example:**

  ```tsx title="src/components/Button.tsx"
  import { hstack } from "../../styled-system/patterns";
  import { css, cva } from "../../styled-system/css";

  export const Button = ({ css: cssProp = {}, children }) => {
    // using the flex pattern
    const hstackProps = hstack.raw({
      border: "1px solid",
      _hover: { color: "blue.400" },
    });

    // merging the styles
    const className = css(hstackProps, cssProp);

    return <button className={className}>{children}</button>;
  };
  ```

  **CVA Example:**

  ```tsx title="src/components/Button.tsx"
  import { css, cva } from "../../styled-system/css";

  const buttonRecipe = cva({
    base: { display: "flex", fontSize: "lg" },
    variants: {
      variant: {
        primary: { color: "white", backgroundColor: "blue.500" },
      },
    },
  });

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      // using the button recipe
      buttonRecipe.raw({ variant: "primary" }),

      // adding style overrides (internal)
      { _hover: { color: "blue.400" } },

      // adding style overrides (external)
      cssProp,
    );

    return <button className={className}>{props.children}</button>;
  };
  ```

- 36fdff89: Fix bug in generated js code for atomic slot recipe produce where `splitVariantProps` didn't work without
  the first slot key.
  - @pandacss/core@0.12.2
  - @pandacss/is-valid-prop@0.12.2
  - @pandacss/logger@0.12.2
  - @pandacss/shared@0.12.2
  - @pandacss/token-dictionary@0.12.2
  - @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- 599fbc1a: Fix issue where `AnimationName` type was generated wrongly if keyframes were not resolved
  - @pandacss/core@0.12.1
  - @pandacss/is-valid-prop@0.12.1
  - @pandacss/logger@0.12.1
  - @pandacss/shared@0.12.1
  - @pandacss/token-dictionary@0.12.1
  - @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- a41515de: Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- bf2ff391: Add `animationName` utility
- ad1518b8: fix failed styled component for solid-js when using recipe
  - @pandacss/core@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/is-valid-prop@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

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

- dfb3f85f: Add missing svg props types
- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/core@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- 5b95caf5: Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook)
  dependency
- 39b80b49: Fix an issue with the runtime className generation when using an utility that maps to multiple shorthands
- 1dc788bd: Fix issue where some style properties shows TS error when using `!important`
- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/core@0.11.0
  - @pandacss/token-dictionary@0.11.0
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

- 24e783b3: Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and
  further reduce it.

  `config.jsxStyleProps`:

  - When set to 'all', all style props are allowed.
  - When set to 'minimal', only the `css` prop is allowed.
  - When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
    - `<styled.div />` and `styled("div")` aren't valid
    - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- 386e5098: Update `RecipeVariantProps` to support slot recipes
- 6d4eaa68: Refactor code
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [2d2a42da]
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/core@0.10.0
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
  - @pandacss/core@0.9.0
  - @pandacss/token-dictionary@0.9.0
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

- 3f1e7e32: Adds the `{recipe}.raw()` in generated runtime
- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- be0ad578: Fix parser issue with TS path mappings
- b75905d8: Improve generated react jsx types to remove legacy ref. This fixes type composition issues.
- 0520ba83: Refactor generated recipe js code
- 156b6bde: Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`
- Updated dependencies [fb449016]
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/core@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- a9c189b7: Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/core@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- cd912f35: Fix `definePattern` module overriden type, was missing an `extends` constraint which lead to a type error:

  ```
  styled-system/types/global.d.ts:14:58 - error TS2344: Type 'T' does not satisfy the constraint 'PatternProperties'.

  14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                                              ~

    styled-system/types/global.d.ts:14:33
      14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                         ~
      This type parameter might need an `extends PatternProperties` constraint.

  ```

- dc4e80f7: Export `isCssProperty` helper function from styled-system/jsx
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
- Updated dependencies [12c900ee]
- Updated dependencies [5bd88c41]
- Updated dependencies [ef1dd676]
- Updated dependencies [b50675ca]
  - @pandacss/core@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 53fb0708: Fix `config.staticCss` by filtering types on getPropertyKeys

  It used to throw because of them:

  ```bash
  <css input>:33:21: Missed semicolon
   ELIFECYCLE  Command failed with exit code 1.
  ```

  ```css
  @layer utilities {
      .m_type\:Tokens\[\"spacing\"\] {
          margin: type:Tokens["spacing"]
      }
  }
  ```

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
- b8f8c2a6: Fix reset.css (generated when config has `preflight: true`) import order, always place it first so that it
  can be easily overriden
- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/core@0.5.1
  - @pandacss/token-dictionary@0.5.1
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

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/core@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/is-valid-prop@0.5.0
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

- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [2a1e9386]
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/core@0.4.0
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/core@0.3.2
- @pandacss/is-valid-prop@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/core@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/core@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/core@0.0.2
  - @pandacss/is-valid-prop@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
