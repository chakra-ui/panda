import { describe, expect, test } from 'vitest'
import { fixtureDefaults } from '@pandacss/fixture'
import { Generator } from '../src'
import { type StaticCssOptions } from '@pandacss/types'

describe('static-css', () => {
  // limit the number of tokens to speed up tests and make snapshots more readable
  const { hooks, ...defaults } = fixtureDefaults
  const conf = {
    hooks,
    ...defaults,
    config: {
      ...defaults.config,
      theme: JSON.parse(JSON.stringify(defaults.config.theme)),
    },
  } as typeof fixtureDefaults

  // @ts-expect-error
  conf.config.theme!.tokens.colors = {
    red: { 200: { value: 'red.200' } },
    blue: { 200: { value: 'blue.200' } },
    green: { 200: { value: 'green.200' } },
  }

  // @ts-expect-error
  conf.config.theme!.tokens.sizes = {
    20: { value: '20px' },
    40: { value: '40px' },
    60: { value: '60px' },
  }
  // @ts-expect-error
  conf.config.theme!.tokens.spacing = conf.config.theme!.tokens.sizes

  conf.config.theme!.semanticTokens = {}

  const ctx = new Generator(conf)
  const getStaticCss = (options: StaticCssOptions) => {
    const engine = ctx.staticCss.fork().process(options)
    return { results: engine.results, css: engine.sheet.toCss({ optimize: true }) }
  }

  test('works', () => {
    expect(
      getStaticCss({
        css: [
          {
            conditions: ['sm', 'md'],
            properties: {
              margin: ['20px', '40px'],
              padding: ['20px', '40px', '60px'],
            },
          },
          {
            conditions: ['light', 'dark'],
            properties: {
              color: ['*'],
            },
          },
        ],
        recipes: {
          buttonStyle: [
            {
              size: ['sm', 'md'],
              conditions: ['sm', 'md'],
            },
            { variant: ['primary', 'secondary'] },
          ],
          tooltipStyle: ['*'],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer recipes {
        @layer _base {
          .buttonStyle {
            justify-content: center;
            align-items: center;
            display: inline-flex;
          }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
          }
        }

        .buttonStyle--size_sm {
          min-width: 2.5rem;
          height: 2.5rem;
          padding: 0 .5rem;
        }

        @media screen and (width >= 40em) {
          .sm\\\\:buttonStyle--size_sm {
            min-width: 2.5rem;
            height: 2.5rem;
            padding: 0 .5rem;
          }
        }

        @media screen and (width >= 48em) {
          .md\\\\:buttonStyle--size_sm {
            min-width: 2.5rem;
            height: 2.5rem;
            padding: 0 .5rem;
          }
        }

        .buttonStyle--variant_solid {
          color: #fff;
          background-color: #00f;
        }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: #00008b;
        }

        .buttonStyle--variant_solid[data-disabled] {
          color: #000;
          background-color: gray;
        }

        .buttonStyle--size_md {
          min-width: 3rem;
          height: 3rem;
          padding: 0 .75rem;
        }

        @media screen and (width >= 40em) {
          .sm\\\\:buttonStyle--size_md {
            min-width: 3rem;
            height: 3rem;
            padding: 0 .75rem;
          }
        }

        @media screen and (width >= 48em) {
          .md\\\\:buttonStyle--size_md {
            min-width: 3rem;
            height: 3rem;
            padding: 0 .75rem;
          }
        }
      }

      @layer utilities {
        .m_20px {
          margin: 20px;
        }

        .m_40px {
          margin: 40px;
        }

        .p_20px {
          padding: 20px;
        }

        .p_40px {
          padding: 40px;
        }

        .p_60px {
          padding: 60px;
        }

        .text_red\\\\.200 {
          color: var(--colors-red-200);
        }

        .text_blue\\\\.200 {
          color: var(--colors-blue-200);
        }

        .text_green\\\\.200 {
          color: var(--colors-green-200);
        }

        .text_colorPalette\\\\.200 {
          color: var(--colors-color-palette-200);
        }

        [data-theme=\\"light\\"] .light\\\\:text_red\\\\.200, .light .light\\\\:text_red\\\\.200, .light\\\\:text_red\\\\.200.light, .light\\\\:text_red\\\\.200[data-theme=\\"light\\"], [data-theme=\\"dark\\"] .dark\\\\:text_red\\\\.200, .dark .dark\\\\:text_red\\\\.200, .dark\\\\:text_red\\\\.200.dark, .dark\\\\:text_red\\\\.200[data-theme=\\"dark\\"] {
          color: var(--colors-red-200);
        }

        [data-theme=\\"light\\"] .light\\\\:text_blue\\\\.200, .light .light\\\\:text_blue\\\\.200, .light\\\\:text_blue\\\\.200.light, .light\\\\:text_blue\\\\.200[data-theme=\\"light\\"], [data-theme=\\"dark\\"] .dark\\\\:text_blue\\\\.200, .dark .dark\\\\:text_blue\\\\.200, .dark\\\\:text_blue\\\\.200.dark, .dark\\\\:text_blue\\\\.200[data-theme=\\"dark\\"] {
          color: var(--colors-blue-200);
        }

        [data-theme=\\"light\\"] .light\\\\:text_green\\\\.200, .light .light\\\\:text_green\\\\.200, .light\\\\:text_green\\\\.200.light, .light\\\\:text_green\\\\.200[data-theme=\\"light\\"], [data-theme=\\"dark\\"] .dark\\\\:text_green\\\\.200, .dark .dark\\\\:text_green\\\\.200, .dark\\\\:text_green\\\\.200.dark, .dark\\\\:text_green\\\\.200[data-theme=\\"dark\\"] {
          color: var(--colors-green-200);
        }

        [data-theme=\\"light\\"] .light\\\\:text_colorPalette\\\\.200, .light .light\\\\:text_colorPalette\\\\.200, .light\\\\:text_colorPalette\\\\.200.light, .light\\\\:text_colorPalette\\\\.200[data-theme=\\"light\\"], [data-theme=\\"dark\\"] .dark\\\\:text_colorPalette\\\\.200, .dark .dark\\\\:text_colorPalette\\\\.200, .dark\\\\:text_colorPalette\\\\.200.dark, .dark\\\\:text_colorPalette\\\\.200[data-theme=\\"dark\\"] {
          color: var(--colors-color-palette-200);
        }

        @media screen and (width >= 40em) {
          .sm\\\\:m_20px {
            margin: 20px;
          }

          .sm\\\\:m_40px {
            margin: 40px;
          }

          .sm\\\\:p_20px {
            padding: 20px;
          }

          .sm\\\\:p_40px {
            padding: 40px;
          }

          .sm\\\\:p_60px {
            padding: 60px;
          }
        }

        @media screen and (width >= 48em) {
          .md\\\\:m_20px {
            margin: 20px;
          }

          .md\\\\:m_40px {
            margin: 40px;
          }

          .md\\\\:p_20px {
            padding: 20px;
          }

          .md\\\\:p_40px {
            padding: 40px;
          }

          .md\\\\:p_60px {
            padding: 60px;
          }
        }
      }
      ",
        "results": {
          "css": [
            {
              "margin": {
                "base": "20px",
                "md": "20px",
                "sm": "20px",
              },
            },
            {
              "margin": {
                "base": "40px",
                "md": "40px",
                "sm": "40px",
              },
            },
            {
              "padding": {
                "base": "20px",
                "md": "20px",
                "sm": "20px",
              },
            },
            {
              "padding": {
                "base": "40px",
                "md": "40px",
                "sm": "40px",
              },
            },
            {
              "padding": {
                "base": "60px",
                "md": "60px",
                "sm": "60px",
              },
            },
            {
              "color": {
                "_dark": "red.200",
                "_light": "red.200",
                "base": "red.200",
              },
            },
            {
              "color": {
                "_dark": "blue.200",
                "_light": "blue.200",
                "base": "blue.200",
              },
            },
            {
              "color": {
                "_dark": "green.200",
                "_light": "green.200",
                "base": "green.200",
              },
            },
            {
              "color": {
                "_dark": "colorPalette.200",
                "_light": "colorPalette.200",
                "base": "colorPalette.200",
              },
            },
          ],
          "patterns": [],
          "recipes": [
            {
              "buttonStyle": {
                "size": {
                  "base": "sm",
                  "md": "sm",
                  "sm": "sm",
                },
              },
            },
            {
              "buttonStyle": {
                "size": {
                  "base": "md",
                  "md": "md",
                  "sm": "md",
                },
              },
            },
            {
              "buttonStyle": {
                "variant": "primary",
              },
            },
            {
              "buttonStyle": {
                "variant": "secondary",
              },
            },
          ],
        },
      }
    `)
  })

  test('using * as RecipeRule', () => {
    expect(
      getStaticCss({
        css: [],
        recipes: {
          buttonStyle: ['*'],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer recipes {
        @layer _base {
          .buttonStyle {
            justify-content: center;
            align-items: center;
            display: inline-flex;
          }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
          }
        }

        .buttonStyle--size_sm {
          min-width: 2.5rem;
          height: 2.5rem;
          padding: 0 .5rem;
        }

        .buttonStyle--variant_solid {
          color: #fff;
          background-color: #00f;
        }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: #00008b;
        }

        .buttonStyle--variant_solid[data-disabled] {
          color: #000;
          background-color: gray;
        }

        .buttonStyle--size_md {
          min-width: 3rem;
          height: 3rem;
          padding: 0 .75rem;
        }

        .buttonStyle--variant_outline {
          color: #00f;
          background-color: #0000;
          border: 1px solid #00f;
        }

        .buttonStyle--variant_outline:is(:hover, [data-hover]) {
          color: #fff;
          background-color: #00f;
        }

        .buttonStyle--variant_outline[data-disabled] {
          color: gray;
          background-color: #0000;
          border: 1px solid gray;
        }
      }
      ",
        "results": {
          "css": [],
          "patterns": [],
          "recipes": [
            {
              "buttonStyle": {
                "size": "sm",
              },
            },
            {
              "buttonStyle": {
                "size": "md",
              },
            },
            {
              "buttonStyle": {
                "variant": "solid",
              },
            },
            {
              "buttonStyle": {
                "variant": "outline",
              },
            },
          ],
        },
      }
    `)
  })

  test('using * in CssRule', () => {
    expect(
      getStaticCss({
        css: [{ properties: { margin: ['*'] } }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer utilities {
        .m_20 {
          margin: var(--spacing-20);
        }

        .m_40 {
          margin: var(--spacing-40);
        }

        .m_60 {
          margin: var(--spacing-60);
        }

        .m_auto {
          margin: auto;
        }

        .m_-20 {
          margin: calc(var(--spacing-20) * -1);
        }

        .m_-40 {
          margin: calc(var(--spacing-40) * -1);
        }

        .m_-60 {
          margin: calc(var(--spacing-60) * -1);
        }
      }
      ",
        "results": {
          "css": [
            {
              "margin": "20",
            },
            {
              "margin": "40",
            },
            {
              "margin": "60",
            },
            {
              "margin": "auto",
            },
            {
              "margin": "-20",
            },
            {
              "margin": "-40",
            },
            {
              "margin": "-60",
            },
          ],
          "patterns": [],
          "recipes": [],
        },
      }
    `)
  })

  test('using * in CssRule', () => {
    expect(
      getStaticCss({
        css: [{ properties: { padding: ['*'] } }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer utilities {
        .p_20 {
          padding: var(--spacing-20);
        }

        .p_40 {
          padding: var(--spacing-40);
        }

        .p_60 {
          padding: var(--spacing-60);
        }

        .p_-20 {
          padding: calc(var(--spacing-20) * -1);
        }

        .p_-40 {
          padding: calc(var(--spacing-40) * -1);
        }

        .p_-60 {
          padding: calc(var(--spacing-60) * -1);
        }
      }
      ",
        "results": {
          "css": [
            {
              "padding": "20",
            },
            {
              "padding": "40",
            },
            {
              "padding": "60",
            },
            {
              "padding": "-20",
            },
            {
              "padding": "-40",
            },
            {
              "padding": "-60",
            },
          ],
          "patterns": [],
          "recipes": [],
        },
      }
    `)
  })

  test('using * in CssRule and conditions list', () => {
    expect(
      getStaticCss({
        css: [{ properties: { color: ['*'] }, conditions: ['hover', 'focus'] }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer utilities {
        .text_red\\\\.200 {
          color: var(--colors-red-200);
        }

        .text_blue\\\\.200 {
          color: var(--colors-blue-200);
        }

        .text_green\\\\.200 {
          color: var(--colors-green-200);
        }

        .text_colorPalette\\\\.200 {
          color: var(--colors-color-palette-200);
        }

        .focus\\\\:text_red\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-red-200);
        }

        .focus\\\\:text_blue\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-blue-200);
        }

        .focus\\\\:text_green\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-green-200);
        }

        .focus\\\\:text_colorPalette\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-color-palette-200);
        }

        .hover\\\\:text_red\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-red-200);
        }

        .hover\\\\:text_blue\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-blue-200);
        }

        .hover\\\\:text_green\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-green-200);
        }

        .hover\\\\:text_colorPalette\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-color-palette-200);
        }
      }
      ",
        "results": {
          "css": [
            {
              "color": {
                "_focus": "red.200",
                "_hover": "red.200",
                "base": "red.200",
              },
            },
            {
              "color": {
                "_focus": "blue.200",
                "_hover": "blue.200",
                "base": "blue.200",
              },
            },
            {
              "color": {
                "_focus": "green.200",
                "_hover": "green.200",
                "base": "green.200",
              },
            },
            {
              "color": {
                "_focus": "colorPalette.200",
                "_hover": "colorPalette.200",
                "base": "colorPalette.200",
              },
            },
          ],
          "patterns": [],
          "recipes": [],
        },
      }
    `)
  })

  test('simple recipe', () => {
    expect(
      getStaticCss({
        recipes: {
          buttonStyle: [{ size: ['md'], conditions: ['md'] }],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer recipes {
        @layer _base {
          .buttonStyle {
            justify-content: center;
            align-items: center;
            display: inline-flex;
          }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
          }
        }

        .buttonStyle--size_md {
          min-width: 3rem;
          height: 3rem;
          padding: 0 .75rem;
        }

        @media screen and (width >= 48em) {
          .md\\\\:buttonStyle--size_md {
            min-width: 3rem;
            height: 3rem;
            padding: 0 .75rem;
          }
        }

        .buttonStyle--variant_solid {
          color: #fff;
          background-color: #00f;
        }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: #00008b;
        }

        .buttonStyle--variant_solid[data-disabled] {
          color: #000;
          background-color: gray;
        }
      }
      ",
        "results": {
          "css": [],
          "patterns": [],
          "recipes": [
            {
              "buttonStyle": {
                "size": {
                  "base": "md",
                  "md": "md",
                },
              },
            },
          ],
        },
      }
    `)
  })

  test('slot recipe', () => {
    expect(
      getStaticCss({
        recipes: {
          checkbox: [{ size: ['lg'], conditions: ['lg'] }],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer recipes.slots {
        @layer _base {
          .checkbox__root {
            align-items: center;
            gap: 2px;
            display: flex;
          }

          .checkbox__control {
            border-radius: var(--radii-sm);
            border-width: 1px;
          }

          .checkbox__label {
            margin-inline-start: 2px;
          }
        }

        .checkbox__control--size_lg {
          width: 12px;
          height: 12px;
        }

        .checkbox__label--size_lg {
          font-size: var(--font-sizes-lg);
        }

        @media screen and (width >= 64em) {
          .lg\\\\:checkbox__control--size_lg {
            width: 12px;
            height: 12px;
          }

          .lg\\\\:checkbox__label--size_lg {
            font-size: var(--font-sizes-lg);
          }
        }
      }
      ",
        "results": {
          "css": [],
          "patterns": [],
          "recipes": [
            {
              "checkbox": {
                "size": {
                  "base": "lg",
                  "lg": "lg",
                },
              },
            },
          ],
        },
      }
    `)
  })

  test('simple pattern', () => {
    expect(
      getStaticCss({
        patterns: {
          // type: 'number'
          aspectRatio: [
            { properties: { ratio: ['4/3', '16/9', '1/1'] } },
            { properties: { ratio: ['1/4'] }, conditions: ['md'] },
          ],
          // type: 'token'
          spacer: [{ properties: { size: ['sm', 'md', 'lg'] } }],
          // type: 'property'
          circle: [{ properties: { size: ['sm', 'md', 'lg'] } }],
          bleed: [{ properties: { inline: ['*'] } }],
          // type: 'enum' + type: 'token'
          divider: [{ properties: { orientation: ['*'], thickness: ['*'] } }],
          float: ['*'],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer utilities {
        .pos_relative {
          position: relative;
        }

        .self_stretch {
          align-self: stretch;
        }

        .justify-self_stretch {
          justify-self: stretch;
        }

        .flex_0_0_sm {
          flex: 0 0 sm;
        }

        .flex_0_0_md {
          flex: 0 0 md;
        }

        .flex_0_0_lg {
          flex: 0 0 lg;
        }

        .d_flex {
          display: flex;
        }

        .items_center {
          align-items: center;
        }

        .justify_center {
          justify-content: center;
        }

        .flex_0_0_auto {
          flex: none;
        }

        .w_sm {
          width: sm;
        }

        .h_sm {
          height: sm;
        }

        .rounded_9999px {
          border-radius: 9999px;
        }

        .w_md {
          width: md;
        }

        .h_md {
          height: md;
        }

        .w_lg {
          width: lg;
        }

        .h_lg {
          height: lg;
        }

        .--thickness_1px {
          --thickness: 1px;
        }

        .w_100\\\\% {
          width: 100%;
        }

        .border-block-end-width_var\\\\(--thickness\\\\) {
          border-block-end-width: var(--thickness);
        }

        .h_100\\\\% {
          height: 100%;
        }

        .border-e_var\\\\(--thickness\\\\) {
          border-inline-end-width: var(--thickness);
        }

        .--thickness_20 {
          --thickness: 20;
        }

        .--thickness_40 {
          --thickness: 40;
        }

        .--thickness_60 {
          --thickness: 60;
        }

        .--thickness_breakpoint-sm {
          --thickness: breakpoint-sm;
        }

        .--thickness_breakpoint-md {
          --thickness: breakpoint-md;
        }

        .--thickness_breakpoint-lg {
          --thickness: breakpoint-lg;
        }

        .--thickness_breakpoint-xl {
          --thickness: breakpoint-xl;
        }

        .--thickness_breakpoint-2xl {
          --thickness: breakpoint-2xl;
        }

        .d_inline-flex {
          display: inline-flex;
        }

        .pos_absolute {
          position: absolute;
        }

        .inset-t_0 {
          inset-block-start: 0;
        }

        .inset-b_auto {
          inset-block-end: auto;
        }

        .start_auto {
          inset-inline-start: auto;
        }

        .end_20 {
          inset-inline-end: var(--spacing-20);
        }

        .translate_50\\\\%_-50\\\\% {
          translate: 50% -50%;
        }

        .end_40 {
          inset-inline-end: var(--spacing-40);
        }

        .end_60 {
          inset-inline-end: var(--spacing-60);
        }

        .end_-20 {
          inset-inline-end: calc(var(--spacing-20) * -1);
        }

        .end_-40 {
          inset-inline-end: calc(var(--spacing-40) * -1);
        }

        .end_-60 {
          inset-inline-end: calc(var(--spacing-60) * -1);
        }

        .inset-t_20 {
          inset-block-start: var(--spacing-20);
        }

        .end_0 {
          inset-inline-end: 0;
        }

        .inset-t_40 {
          inset-block-start: var(--spacing-40);
        }

        .inset-t_60 {
          inset-block-start: var(--spacing-60);
        }

        .inset-t_-20 {
          inset-block-start: calc(var(--spacing-20) * -1);
        }

        .inset-t_-40 {
          inset-block-start: calc(var(--spacing-40) * -1);
        }

        .inset-t_-60 {
          inset-block-start: calc(var(--spacing-60) * -1);
        }

        .inset-t_auto {
          inset-block-start: auto;
        }

        .inset-b_0 {
          inset-block-end: 0;
        }

        .translate_50\\\\%_50\\\\% {
          translate: 50% 50%;
        }

        .start_0 {
          inset-inline-start: 0;
        }

        .end_auto {
          inset-inline-end: auto;
        }

        .translate_-50\\\\%_50\\\\% {
          translate: -50% 50%;
        }

        .translate_-50\\\\%_-50\\\\% {
          translate: -50% -50%;
        }

        .start_50\\\\% {
          inset-inline-start: 50%;
        }

        .end_50\\\\% {
          inset-inline-end: 50%;
        }

        .inset-t_50\\\\% {
          inset-block-start: 50%;
        }

        .inset-b_50\\\\% {
          inset-block-end: 50%;
        }

        .before\\\\:content_\\\\\\"\\\\\\":before {
          content: \\"\\";
        }

        .before\\\\:d_block:before {
          display: block;
        }

        .before\\\\:h_0:before {
          height: 0;
        }

        .before\\\\:pb_NaN\\\\%:before {
          padding-bottom: NaN% ;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:d_flex > * {
          display: flex;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:justify_center > * {
          justify-content: center;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:items_center > * {
          align-items: center;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:overflow_hidden > * {
          overflow: hidden;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:pos_absolute > * {
          position: absolute;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:inset_0 > * {
          inset: 0;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:w_100\\\\% > * {
          width: 100%;
        }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:h_100\\\\% > * {
          height: 100%;
        }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover > img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover > video {
          object-fit: cover;
        }

        @media screen and (width >= 48em) {
          .before\\\\:md\\\\:pb_NaN\\\\%:before {
            padding-bottom: NaN% ;
          }
        }
      }
      ",
        "results": {
          "css": [],
          "patterns": [
            {
              "aspectRatio": {
                "ratio": "4/3",
              },
            },
            {
              "aspectRatio": {
                "ratio": "16/9",
              },
            },
            {
              "aspectRatio": {
                "ratio": "1/1",
              },
            },
            {
              "aspectRatio": {
                "ratio": {
                  "base": "1/4",
                  "md": "1/4",
                },
              },
            },
            {
              "spacer": {
                "size": "sm",
              },
            },
            {
              "spacer": {
                "size": "md",
              },
            },
            {
              "spacer": {
                "size": "lg",
              },
            },
            {
              "circle": {
                "size": "sm",
              },
            },
            {
              "circle": {
                "size": "md",
              },
            },
            {
              "circle": {
                "size": "lg",
              },
            },
            {
              "divider": {
                "orientation": "horizontal",
              },
            },
            {
              "divider": {
                "orientation": "vertical",
              },
            },
            {
              "divider": {
                "thickness": "20",
              },
            },
            {
              "divider": {
                "thickness": "40",
              },
            },
            {
              "divider": {
                "thickness": "60",
              },
            },
            {
              "divider": {
                "thickness": "breakpoint-sm",
              },
            },
            {
              "divider": {
                "thickness": "breakpoint-md",
              },
            },
            {
              "divider": {
                "thickness": "breakpoint-lg",
              },
            },
            {
              "divider": {
                "thickness": "breakpoint-xl",
              },
            },
            {
              "divider": {
                "thickness": "breakpoint-2xl",
              },
            },
            {
              "float": {
                "offsetX": "20",
              },
            },
            {
              "float": {
                "offsetX": "40",
              },
            },
            {
              "float": {
                "offsetX": "60",
              },
            },
            {
              "float": {
                "offsetX": "-20",
              },
            },
            {
              "float": {
                "offsetX": "-40",
              },
            },
            {
              "float": {
                "offsetX": "-60",
              },
            },
            {
              "float": {
                "offsetY": "20",
              },
            },
            {
              "float": {
                "offsetY": "40",
              },
            },
            {
              "float": {
                "offsetY": "60",
              },
            },
            {
              "float": {
                "offsetY": "-20",
              },
            },
            {
              "float": {
                "offsetY": "-40",
              },
            },
            {
              "float": {
                "offsetY": "-60",
              },
            },
            {
              "float": {
                "offset": "20",
              },
            },
            {
              "float": {
                "offset": "40",
              },
            },
            {
              "float": {
                "offset": "60",
              },
            },
            {
              "float": {
                "offset": "-20",
              },
            },
            {
              "float": {
                "offset": "-40",
              },
            },
            {
              "float": {
                "offset": "-60",
              },
            },
            {
              "float": {
                "placement": "bottom-end",
              },
            },
            {
              "float": {
                "placement": "bottom-start",
              },
            },
            {
              "float": {
                "placement": "top-end",
              },
            },
            {
              "float": {
                "placement": "top-start",
              },
            },
            {
              "float": {
                "placement": "bottom-center",
              },
            },
            {
              "float": {
                "placement": "top-center",
              },
            },
            {
              "float": {
                "placement": "middle-center",
              },
            },
            {
              "float": {
                "placement": "middle-end",
              },
            },
            {
              "float": {
                "placement": "middle-start",
              },
            },
          ],
          "recipes": [],
        },
      }
    `)
  })
})
