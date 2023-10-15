import { describe, expect, test } from 'vitest'
import { generatorConfig } from './fixture'
import { createGenerator } from '../src'
import { type StaticCssOptions } from '@pandacss/types'

describe('static-css', () => {
  // limit the number of colors to speed up tests and make snapshots more readable
  const conf = { ...generatorConfig }

  // @ts-expect-error
  conf.config.theme!.tokens.colors = {
    red: { 200: { value: 'red.200' } },
    blue: { 200: { value: 'blue.200' } },
    green: { 200: { value: 'green.200' } },
  }

  // @ts-expect-error
  conf.config.theme!.tokens.spacing = {
    20: { value: '20px' },
    40: { value: '40px' },
    60: { value: '60px' },
  }

  conf.config.theme!.semanticTokens = {}

  const staticCss = createGenerator(conf).staticCss
  const getStaticCss = (options: StaticCssOptions) => {
    const result = staticCss(options)
    return { results: result.results, css: result.toCss() }
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
        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center
      }
      }

        @media screen and (min-width: 40em) {
          .sm\\\\:buttonStyle--size_sm {
            height: 2.5rem;
            min-width: 2.5rem;
            padding: 0 0.5rem
          }

          .sm\\\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:buttonStyle--size_sm {
            height: 2.5rem;
            min-width: 2.5rem;
            padding: 0 0.5rem
          }

          .md\\\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem
          }
      }
      }

      @layer utilities {
        .m_20px {
          margin: 20px
      }

        .m_40px {
          margin: 40px
      }

        .p_20px {
          padding: 20px
      }

        .p_40px {
          padding: 40px
      }

        .p_60px {
          padding: 60px
      }

        .text_red\\\\.200 {
          color: var(--colors-red-200)
      }

        .text_blue\\\\.200 {
          color: var(--colors-blue-200)
      }

        .text_green\\\\.200 {
          color: var(--colors-green-200)
      }

        .text_colorPalette\\\\.200 {
          color: var(--colors-color-palette-200)
      }

        [data-theme=light] .light\\\\:text_red\\\\.200, .light .light\\\\:text_red\\\\.200, .light\\\\:text_red\\\\.200.light, .light\\\\:text_red\\\\.200[data-theme=light],[data-theme=dark] .dark\\\\:text_red\\\\.200, .dark .dark\\\\:text_red\\\\.200, .dark\\\\:text_red\\\\.200.dark, .dark\\\\:text_red\\\\.200[data-theme=dark] {
          color: var(--colors-red-200)
      }

        [data-theme=light] .light\\\\:text_blue\\\\.200, .light .light\\\\:text_blue\\\\.200, .light\\\\:text_blue\\\\.200.light, .light\\\\:text_blue\\\\.200[data-theme=light],[data-theme=dark] .dark\\\\:text_blue\\\\.200, .dark .dark\\\\:text_blue\\\\.200, .dark\\\\:text_blue\\\\.200.dark, .dark\\\\:text_blue\\\\.200[data-theme=dark] {
          color: var(--colors-blue-200)
      }

        [data-theme=light] .light\\\\:text_green\\\\.200, .light .light\\\\:text_green\\\\.200, .light\\\\:text_green\\\\.200.light, .light\\\\:text_green\\\\.200[data-theme=light],[data-theme=dark] .dark\\\\:text_green\\\\.200, .dark .dark\\\\:text_green\\\\.200, .dark\\\\:text_green\\\\.200.dark, .dark\\\\:text_green\\\\.200[data-theme=dark] {
          color: var(--colors-green-200)
      }

        [data-theme=light] .light\\\\:text_colorPalette\\\\.200, .light .light\\\\:text_colorPalette\\\\.200, .light\\\\:text_colorPalette\\\\.200.light, .light\\\\:text_colorPalette\\\\.200[data-theme=light],[data-theme=dark] .dark\\\\:text_colorPalette\\\\.200, .dark .dark\\\\:text_colorPalette\\\\.200, .dark\\\\:text_colorPalette\\\\.200.dark, .dark\\\\:text_colorPalette\\\\.200[data-theme=dark] {
          color: var(--colors-color-palette-200)
      }

        @media screen and (min-width: 40em) {
          .sm\\\\:m_20px {
            margin: 20px
          }

          .sm\\\\:m_40px {
            margin: 40px
          }

          .sm\\\\:p_20px {
            padding: 20px
          }

          .sm\\\\:p_40px {
            padding: 40px
          }

          .sm\\\\:p_60px {
            padding: 60px
          }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:m_20px {
            margin: 20px
          }

          .md\\\\:m_40px {
            margin: 40px
          }

          .md\\\\:p_20px {
            padding: 20px
          }

          .md\\\\:p_40px {
            padding: 40px
          }

          .md\\\\:p_60px {
            padding: 60px
          }
      }
      }",
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
        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem
      }

        .buttonStyle--variant_outline {
          background-color: transparent;
          border: 1px solid blue;
          color: blue;
      }

        .buttonStyle--variant_outline[data-disabled] {
          background-color: transparent;
          border: 1px solid gray;
          color: gray;
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--variant_outline:is(:hover, [data-hover]) {
          background-color: blue;
          color: white;
      }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center
      }
      }
      }",
        "results": {
          "css": [],
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
          margin: var(--spacing-20)
      }

        .m_40 {
          margin: var(--spacing-40)
      }

        .m_60 {
          margin: var(--spacing-60)
      }

        .m_auto {
          margin: auto
      }

        .m_-20 {
          margin: calc(var(--spacing-20) * -1)
      }

        .m_-40 {
          margin: calc(var(--spacing-40) * -1)
      }

        .m_-60 {
          margin: calc(var(--spacing-60) * -1)
      }
      }",
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
          padding: var(--spacing-20)
      }

        .p_40 {
          padding: var(--spacing-40)
      }

        .p_60 {
          padding: var(--spacing-60)
      }

        .p_-20 {
          padding: calc(var(--spacing-20) * -1)
      }

        .p_-40 {
          padding: calc(var(--spacing-40) * -1)
      }

        .p_-60 {
          padding: calc(var(--spacing-60) * -1)
      }
      }",
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
          color: var(--colors-red-200)
      }

        .text_blue\\\\.200 {
          color: var(--colors-blue-200)
      }

        .text_green\\\\.200 {
          color: var(--colors-green-200)
      }

        .text_colorPalette\\\\.200 {
          color: var(--colors-color-palette-200)
      }

        .focus\\\\:text_red\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-red-200)
      }

        .focus\\\\:text_blue\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-blue-200)
      }

        .focus\\\\:text_green\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-green-200)
      }

        .focus\\\\:text_colorPalette\\\\.200:is(:focus, [data-focus]) {
          color: var(--colors-color-palette-200)
      }

        .hover\\\\:text_red\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-red-200)
      }

        .hover\\\\:text_blue\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-blue-200)
      }

        .hover\\\\:text_green\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-green-200)
      }

        .hover\\\\:text_colorPalette\\\\.200:is(:hover, [data-hover]) {
          color: var(--colors-color-palette-200)
      }
      }",
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
        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center
      }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem
          }
      }
      }",
        "results": {
          "css": [],
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
        .checkbox__control--size_lg {
          width: var(--sizes-12);
          height: var(--sizes-12)
      }

        .checkbox__label--size_lg {
          font-size: var(--font-sizes-lg)
      }

        @media screen and (min-width: 64em) {
          .lg\\\\:checkbox__control--size_lg {
            width: var(--sizes-12);
            height: var(--sizes-12)
          }

          .lg\\\\:checkbox__label--size_lg {
            font-size: var(--font-sizes-lg)
          }
      }
      }",
        "results": {
          "css": [],
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
})
