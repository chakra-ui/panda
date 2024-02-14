import { fixtureDefaults } from '@pandacss/fixture'
import { type StaticCssOptions } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { Context } from '../src/context'

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

  const ctx = new Context(conf)
  const getStaticCss = (options: StaticCssOptions) => {
    const engine = ctx.staticCss.clone().process(options)
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
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            color: white;
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
      }

          [data-theme=dark] .tooltipStyle[data-tooltip],.dark .tooltipStyle[data-tooltip],.tooltipStyle[data-tooltip].dark,.tooltipStyle[data-tooltip][data-theme=dark],[data-theme=dark] .tooltipStyle [data-tooltip],.dark .tooltipStyle [data-tooltip],.tooltipStyle [data-tooltip].dark,.tooltipStyle [data-tooltip][data-theme=dark] {
            color: red;
      }
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem;
      }

        .buttonStyle--variant_solid {
          color: white;
          background-color: blue;
      }

        .buttonStyle--variant_solid[data-disabled] {
          color: black;
          background-color: gray;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem;
      }

        @media screen and (min-width: 40em) {
          .sm\\:buttonStyle--size_sm {
            height: 2.5rem;
            min-width: 2.5rem;
            padding: 0 0.5rem;
      }
          .sm\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem;
      }
      }

        @media screen and (min-width: 48em) {
          .md\\:buttonStyle--size_sm {
            height: 2.5rem;
            min-width: 2.5rem;
            padding: 0 0.5rem;
      }
          .md\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem;
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

        .text_red\\.200 {
          color: var(--colors-red-200);
      }

        .text_blue\\.200 {
          color: var(--colors-blue-200);
      }

        .text_green\\.200 {
          color: var(--colors-green-200);
      }

        .text_colorPalette\\.200 {
          color: var(--colors-color-palette-200);
      }

        [data-theme=light] .light\\:text_red\\.200,.light .light\\:text_red\\.200,.light\\:text_red\\.200.light,.light\\:text_red\\.200[data-theme=light],[data-theme=dark] .dark\\:text_red\\.200,.dark .dark\\:text_red\\.200,.dark\\:text_red\\.200.dark,.dark\\:text_red\\.200[data-theme=dark] {
          color: var(--colors-red-200);
      }

        [data-theme=light] .light\\:text_blue\\.200,.light .light\\:text_blue\\.200,.light\\:text_blue\\.200.light,.light\\:text_blue\\.200[data-theme=light],[data-theme=dark] .dark\\:text_blue\\.200,.dark .dark\\:text_blue\\.200,.dark\\:text_blue\\.200.dark,.dark\\:text_blue\\.200[data-theme=dark] {
          color: var(--colors-blue-200);
      }

        [data-theme=light] .light\\:text_green\\.200,.light .light\\:text_green\\.200,.light\\:text_green\\.200.light,.light\\:text_green\\.200[data-theme=light],[data-theme=dark] .dark\\:text_green\\.200,.dark .dark\\:text_green\\.200,.dark\\:text_green\\.200.dark,.dark\\:text_green\\.200[data-theme=dark] {
          color: var(--colors-green-200);
      }

        [data-theme=light] .light\\:text_colorPalette\\.200,.light .light\\:text_colorPalette\\.200,.light\\:text_colorPalette\\.200.light,.light\\:text_colorPalette\\.200[data-theme=light],[data-theme=dark] .dark\\:text_colorPalette\\.200,.dark .dark\\:text_colorPalette\\.200,.dark\\:text_colorPalette\\.200.dark,.dark\\:text_colorPalette\\.200[data-theme=dark] {
          color: var(--colors-color-palette-200);
      }

        @media screen and (min-width: 40em) {
          .sm\\:m_20px {
            margin: 20px;
      }
          .sm\\:m_40px {
            margin: 40px;
      }
          .sm\\:p_20px {
            padding: 20px;
      }
          .sm\\:p_40px {
            padding: 40px;
      }
          .sm\\:p_60px {
            padding: 60px;
      }
      }

        @media screen and (min-width: 48em) {
          .md\\:m_20px {
            margin: 20px;
      }
          .md\\:m_40px {
            margin: 40px;
      }
          .md\\:p_20px {
            padding: 20px;
      }
          .md\\:p_40px {
            padding: 40px;
      }
          .md\\:p_60px {
            padding: 60px;
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
          "patterns": [],
          "recipes": [
            {
              "buttonStyle": {},
            },
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
            {
              "tooltipStyle": {},
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
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            color: white;
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
      }
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem;
      }

        .buttonStyle--variant_solid {
          color: white;
          background-color: blue;
      }

        .buttonStyle--variant_solid[data-disabled] {
          color: black;
          background-color: gray;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem;
      }

        .buttonStyle--variant_outline {
          border: 1px solid blue;
          color: blue;
          background-color: transparent;
      }

        .buttonStyle--variant_outline[data-disabled] {
          border: 1px solid gray;
          color: gray;
          background-color: transparent;
      }

        .buttonStyle--variant_outline:is(:hover, [data-hover]) {
          color: white;
          background-color: blue;
      }
      }",
        "results": {
          "css": [],
          "patterns": [],
          "recipes": [
            {
              "buttonStyle": {},
            },
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
        .text_red\\.200 {
          color: var(--colors-red-200);
      }

        .text_blue\\.200 {
          color: var(--colors-blue-200);
      }

        .text_green\\.200 {
          color: var(--colors-green-200);
      }

        .text_colorPalette\\.200 {
          color: var(--colors-color-palette-200);
      }

        .focus\\:text_red\\.200:is(:focus, [data-focus]) {
          color: var(--colors-red-200);
      }

        .focus\\:text_blue\\.200:is(:focus, [data-focus]) {
          color: var(--colors-blue-200);
      }

        .focus\\:text_green\\.200:is(:focus, [data-focus]) {
          color: var(--colors-green-200);
      }

        .focus\\:text_colorPalette\\.200:is(:focus, [data-focus]) {
          color: var(--colors-color-palette-200);
      }

        .hover\\:text_red\\.200:is(:hover, [data-hover]) {
          color: var(--colors-red-200);
      }

        .hover\\:text_blue\\.200:is(:hover, [data-hover]) {
          color: var(--colors-blue-200);
      }

        .hover\\:text_green\\.200:is(:hover, [data-hover]) {
          color: var(--colors-green-200);
      }

        .hover\\:text_colorPalette\\.200:is(:hover, [data-hover]) {
          color: var(--colors-color-palette-200);
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
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            color: white;
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
      }
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem;
      }

        .buttonStyle--variant_solid {
          color: white;
          background-color: blue;
      }

        .buttonStyle--variant_solid[data-disabled] {
          color: black;
          background-color: gray;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @media screen and (min-width: 48em) {
          .md\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem;
      }
      }
      }",
        "results": {
          "css": [],
          "patterns": [],
          "recipes": [
            {
              "buttonStyle": {},
            },
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
            display: flex;
            gap: 2px;
            align-items: center;
      }

          .checkbox__control {
            border-radius: var(--radii-sm);
            border-width: 1px;
      }

          .checkbox__label {
            margin-inline-start: 2px;
      }
      }

        .checkbox__control--size_sm {
          font-size: 2rem;
          font-weight: var(--font-weights-bold);
          width: 8px;
          height: 8px;
      }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm);
      }

        .checkbox__control--size_lg {
          width: 12px;
          height: 12px;
      }

        .checkbox__label--size_lg {
          font-size: var(--font-sizes-lg);
      }

        @media screen and (min-width: 64em) {
          .lg\\:checkbox__control--size_lg {
            width: 12px;
            height: 12px;
      }
          .lg\\:checkbox__label--size_lg {
            font-size: var(--font-sizes-lg);
      }
      }
      }",
        "results": {
          "css": [],
          "patterns": [],
          "recipes": [
            {
              "checkbox": {},
            },
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

        .flex_0_0_auto {
          flex: 0 0 auto;
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

        .\\--bleed-x_token\\(spacing\\.20\\,_20\\) {
          --bleed-x: var(--spacing-20, \\320);
      }

        .\\--bleed-y_token\\(spacing\\.0\\,_0\\) {
          --bleed-y: var(spacing\\.0, \\30);
      }

        .mx_calc\\(var\\(--bleed-x\\,_0\\)_\\*_-1\\) {
          margin-inline: calc(var(--bleed-x, 0) * -1);
      }

        .my_calc\\(var\\(--bleed-y\\,_0\\)_\\*_-1\\) {
          margin-block: calc(var(--bleed-y, 0) * -1);
      }

        .\\--bleed-x_token\\(spacing\\.40\\,_40\\) {
          --bleed-x: var(--spacing-40, \\340);
      }

        .\\--bleed-x_token\\(spacing\\.60\\,_60\\) {
          --bleed-x: var(--spacing-60, \\360);
      }

        .\\--bleed-x_token\\(spacing\\.auto\\,_auto\\) {
          --bleed-x: var(spacing\\.auto, auto);
      }

        .\\--bleed-x_token\\(spacing\\.-20\\,_-20\\) {
          --bleed-x: calc(var(--spacing-20) * -1, -\\320);
      }

        .\\--bleed-x_token\\(spacing\\.-40\\,_-40\\) {
          --bleed-x: calc(var(--spacing-40) * -1, -\\340);
      }

        .\\--bleed-x_token\\(spacing\\.-60\\,_-60\\) {
          --bleed-x: calc(var(--spacing-60) * -1, -\\360);
      }

        .\\--thickness_1px {
          --thickness: 1px;
      }

        .w_100\\% {
          width: 100%;
      }

        .h_100\\% {
          height: 100%;
      }

        .\\--thickness_20 {
          --thickness: 20;
      }

        .\\--thickness_40 {
          --thickness: 40;
      }

        .\\--thickness_60 {
          --thickness: 60;
      }

        .\\--thickness_breakpoint-sm {
          --thickness: breakpoint-sm;
      }

        .\\--thickness_breakpoint-md {
          --thickness: breakpoint-md;
      }

        .\\--thickness_breakpoint-lg {
          --thickness: breakpoint-lg;
      }

        .\\--thickness_breakpoint-xl {
          --thickness: breakpoint-xl;
      }

        .\\--thickness_breakpoint-2xl {
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

        .translate_50\\%_-50\\% {
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

        .translate_50\\%_50\\% {
          translate: 50% 50%;
      }

        .start_0 {
          inset-inline-start: 0;
      }

        .end_auto {
          inset-inline-end: auto;
      }

        .translate_-50\\%_50\\% {
          translate: -50% 50%;
      }

        .translate_-50\\%_-50\\% {
          translate: -50% -50%;
      }

        .start_50\\% {
          inset-inline-start: 50%;
      }

        .end_50\\% {
          inset-inline-end: 50%;
      }

        .inset-t_50\\% {
          inset-block-start: 50%;
      }

        .inset-b_50\\% {
          inset-block-end: 50%;
      }

        .self_stretch {
          align-self: stretch;
      }

        .justify-self_stretch {
          justify-self: stretch;
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
      }

        .border-block-end-width_var\\(--thickness\\) {
          border-block-end-width: var(--thickness);
      }

        .border-e_var\\(--thickness\\) {
          border-inline-end-width: var(--thickness);
      }

        .before\\:d_block::before {
          display: block;
      }

        .before\\:h_0::before {
          height: 0;
      }

        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
      }

        .\\[\\&\\>\\*\\]\\:overflow_hidden>* {
          overflow: hidden;
      }

        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
      }

        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: 0;
      }

        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
      }

        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
      }

        .\\[\\&\\>img\\,_\\&\\>video\\]\\:object_cover>img,.\\[\\&\\>img\\,_\\&\\>video\\]\\:object_cover>video {
          object-fit: cover;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }

        .before\\:pb_NaN\\%::before {
          padding-bottom: NaN%;
      }

        .\\[\\&\\>\\*\\]\\:justify_center>* {
          justify-content: center;
      }

        .\\[\\&\\>\\*\\]\\:items_center>* {
          align-items: center;
      }

        @media screen and (min-width: 48em) {
          .md\\:pos_relative {
            position: relative;
      }
          .md\\:before\\:d_block::before {
            display: block;
      }
          .md\\:before\\:h_0::before {
            height: 0;
      }
          .md\\:\\[\\&\\>\\*\\]\\:d_flex>* {
            display: flex;
      }
          .md\\:\\[\\&\\>\\*\\]\\:overflow_hidden>* {
            overflow: hidden;
      }
          .md\\:\\[\\&\\>\\*\\]\\:pos_absolute>* {
            position: absolute;
      }
          .md\\:\\[\\&\\>\\*\\]\\:inset_0>* {
            inset: 0;
      }
          .md\\:\\[\\&\\>\\*\\]\\:w_100\\%>* {
            width: 100%;
      }
          .md\\:\\[\\&\\>\\*\\]\\:h_100\\%>* {
            height: 100%;
      }
          .md\\:\\[\\&\\>img\\,_\\&\\>video\\]\\:object_cover>img,.md\\:\\[\\&\\>img\\,_\\&\\>video\\]\\:object_cover>video {
            object-fit: cover;
      }
          .md\\:before\\:content_\\"\\"::before {
            content: "";
      }
          .md\\:before\\:pb_NaN\\%::before {
            padding-bottom: NaN%;
      }
          .md\\:\\[\\&\\>\\*\\]\\:justify_center>* {
            justify-content: center;
      }
          .md\\:\\[\\&\\>\\*\\]\\:items_center>* {
            align-items: center;
      }
      }
      }",
        "results": {
          "css": [],
          "patterns": [
            {
              "&>*": {
                "alignItems": "center",
                "display": "flex",
                "height": "100%",
                "inset": "0",
                "justifyContent": "center",
                "overflow": "hidden",
                "position": "absolute",
                "width": "100%",
              },
              "&>img, &>video": {
                "objectFit": "cover",
              },
              "_before": {
                "content": """",
                "display": "block",
                "height": "0",
                "paddingBottom": "NaN%",
              },
              "position": "relative",
            },
            {
              "&>*": {
                "alignItems": "center",
                "display": "flex",
                "height": "100%",
                "inset": "0",
                "justifyContent": "center",
                "overflow": "hidden",
                "position": "absolute",
                "width": "100%",
              },
              "&>img, &>video": {
                "objectFit": "cover",
              },
              "_before": {
                "content": """",
                "display": "block",
                "height": "0",
                "paddingBottom": "NaN%",
              },
              "position": "relative",
            },
            {
              "&>*": {
                "alignItems": "center",
                "display": "flex",
                "height": "100%",
                "inset": "0",
                "justifyContent": "center",
                "overflow": "hidden",
                "position": "absolute",
                "width": "100%",
              },
              "&>img, &>video": {
                "objectFit": "cover",
              },
              "_before": {
                "content": """",
                "display": "block",
                "height": "0",
                "paddingBottom": "NaN%",
              },
              "position": "relative",
            },
            {
              "base": {
                "&>*": {
                  "alignItems": "center",
                  "display": "flex",
                  "height": "100%",
                  "inset": "0",
                  "justifyContent": "center",
                  "overflow": "hidden",
                  "position": "absolute",
                  "width": "100%",
                },
                "&>img, &>video": {
                  "objectFit": "cover",
                },
                "_before": {
                  "content": """",
                  "display": "block",
                  "height": "0",
                  "paddingBottom": "NaN%",
                },
                "position": "relative",
              },
              "md": {
                "&>*": {
                  "alignItems": "center",
                  "display": "flex",
                  "height": "100%",
                  "inset": "0",
                  "justifyContent": "center",
                  "overflow": "hidden",
                  "position": "absolute",
                  "width": "100%",
                },
                "&>img, &>video": {
                  "objectFit": "cover",
                },
                "_before": {
                  "content": """",
                  "display": "block",
                  "height": "0",
                  "paddingBottom": "NaN%",
                },
                "position": "relative",
              },
            },
            {
              "alignSelf": "stretch",
              "flex": "0 0 sm",
              "justifySelf": "stretch",
            },
            {
              "alignSelf": "stretch",
              "flex": "0 0 md",
              "justifySelf": "stretch",
            },
            {
              "alignSelf": "stretch",
              "flex": "0 0 lg",
              "justifySelf": "stretch",
            },
            {
              "alignItems": "center",
              "borderRadius": "9999px",
              "display": "flex",
              "flex": "0 0 auto",
              "height": "sm",
              "justifyContent": "center",
              "width": "sm",
            },
            {
              "alignItems": "center",
              "borderRadius": "9999px",
              "display": "flex",
              "flex": "0 0 auto",
              "height": "md",
              "justifyContent": "center",
              "width": "md",
            },
            {
              "alignItems": "center",
              "borderRadius": "9999px",
              "display": "flex",
              "flex": "0 0 auto",
              "height": "lg",
              "justifyContent": "center",
              "width": "lg",
            },
            {
              "--bleed-x": "token(spacing.20, 20)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--bleed-x": "token(spacing.40, 40)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--bleed-x": "token(spacing.60, 60)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--bleed-x": "token(spacing.auto, auto)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--bleed-x": "token(spacing.-20, -20)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--bleed-x": "token(spacing.-40, -40)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--bleed-x": "token(spacing.-60, -60)",
              "--bleed-y": "token(spacing.0, 0)",
              "marginBlock": "calc(var(--bleed-y, 0) * -1)",
              "marginInline": "calc(var(--bleed-x, 0) * -1)",
            },
            {
              "--thickness": "1px",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "1px",
              "borderBlockEndWidth": undefined,
              "borderColor": undefined,
              "borderInlineEndWidth": "var(--thickness)",
              "height": "100%",
              "width": undefined,
            },
            {
              "--thickness": "20",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "40",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "60",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "breakpoint-sm",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "breakpoint-md",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "breakpoint-lg",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "breakpoint-xl",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "--thickness": "breakpoint-2xl",
              "borderBlockEndWidth": "var(--thickness)",
              "borderColor": undefined,
              "borderInlineEndWidth": undefined,
              "height": undefined,
              "width": "100%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "20",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "40",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "60",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "-20",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "-40",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "-60",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "20",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "40",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "60",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "-20",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "-40",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "-60",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "20",
              "insetInlineEnd": "20",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "40",
              "insetInlineEnd": "40",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "60",
              "insetInlineEnd": "60",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "-20",
              "insetInlineEnd": "-20",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "-40",
              "insetInlineEnd": "-40",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "-60",
              "insetInlineEnd": "-60",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "0",
              "insetBlockStart": "auto",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% 50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "0",
              "insetBlockStart": "auto",
              "insetInlineEnd": "auto",
              "insetInlineStart": "0",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "-50% 50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "auto",
              "insetInlineStart": "0",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "-50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "0",
              "insetBlockStart": "auto",
              "insetInlineEnd": "50%",
              "insetInlineStart": "50%",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "-50% 50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "auto",
              "insetBlockStart": "0",
              "insetInlineEnd": "50%",
              "insetInlineStart": "50%",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "-50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "50%",
              "insetBlockStart": "50%",
              "insetInlineEnd": "50%",
              "insetInlineStart": "50%",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "-50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "50%",
              "insetBlockStart": "50%",
              "insetInlineEnd": "0",
              "insetInlineStart": "auto",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "50% -50%",
            },
            {
              "alignItems": "center",
              "display": "inline-flex",
              "insetBlockEnd": "50%",
              "insetBlockStart": "50%",
              "insetInlineEnd": "auto",
              "insetInlineStart": "0",
              "justifyContent": "center",
              "position": "absolute",
              "translate": "-50% -50%",
            },
          ],
          "recipes": [],
        },
      }
    `)
  })

  test('all recipes', () => {
    expect(getStaticCss({ recipes: '*' })).toMatchInlineSnapshot(`
      {
        "css": "@layer recipes {
        @layer _base {
          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }

          .textStyle {
            font-family: var(--fonts-mono);
      }

          [data-theme=dark] .tooltipStyle[data-tooltip],.dark .tooltipStyle[data-tooltip],.tooltipStyle[data-tooltip].dark,.tooltipStyle[data-tooltip][data-theme=dark],[data-theme=dark] .tooltipStyle [data-tooltip],.dark .tooltipStyle [data-tooltip],.tooltipStyle [data-tooltip].dark,.tooltipStyle [data-tooltip][data-theme=dark] {
            color: red;
      }

          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            color: white;
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
      }
      }

        .textStyle--size_h1 {
          font-size: 5rem;
          line-height: 1em;
          font-weight: 800;
      }

        .textStyle--size_h2 {
          letter-spacing: -0.03em;
          font-size: 3rem;
          line-height: 1.2em;
          font-weight: 700;
      }

        .card--rounded_true {
          border-radius: 0.375rem;
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem;
      }

        .buttonStyle--variant_solid {
          color: white;
          background-color: blue;
      }

        .buttonStyle--variant_solid[data-disabled] {
          color: black;
          background-color: gray;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem;
      }

        .buttonStyle--variant_outline {
          border: 1px solid blue;
          color: blue;
          background-color: transparent;
      }

        .buttonStyle--variant_outline[data-disabled] {
          border: 1px solid gray;
          color: gray;
          background-color: transparent;
      }

        .buttonStyle--variant_outline:is(:hover, [data-hover]) {
          color: white;
          background-color: blue;
      }
      }

      @layer recipes.slots {
        @layer _base {
          .checkbox__root {
            display: flex;
            gap: 2px;
            align-items: center;
      }

          .checkbox__control {
            border-radius: var(--radii-sm);
            border-width: 1px;
      }

          .checkbox__label {
            margin-inline-start: 2px;
      }

          .badge__title {
            background: red.300;
            border-radius: var(--radii-sm);
      }
      }

        .checkbox__control--size_sm {
          font-size: 2rem;
          font-weight: var(--font-weights-bold);
          width: 8px;
          height: 8px;
      }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm);
      }

        .checkbox__control--size_md {
          width: 10px;
          height: 10px;
      }

        .checkbox__label--size_md {
          font-size: var(--font-sizes-md);
      }

        .checkbox__control--size_lg {
          width: 12px;
          height: 12px;
      }

        .checkbox__label--size_lg {
          font-size: var(--font-sizes-lg);
      }

        .badge__title--size_sm {
          padding-inline: 4px;
      }

        .badge__body--size_sm {
          color: red;
      }

        .badge__title--raised_true {
          box-shadow: var(--shadows-md);
      }
      }

      @layer utilities {
        .text_ButtonHighlight {
          color: ButtonHighlight;
      }
      }",
        "results": {
          "css": [
            {
              "color": "ButtonHighlight",
            },
          ],
          "patterns": [],
          "recipes": [
            {
              "textStyle": {},
            },
            {
              "textStyle": {
                "size": "h1",
              },
            },
            {
              "textStyle": {
                "size": "h2",
              },
            },
            {
              "tooltipStyle": {},
            },
            {
              "cardStyle": {},
            },
            {
              "cardStyle": {
                "rounded": "true",
              },
            },
            {
              "buttonStyle": {},
            },
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
            {
              "checkbox": {},
            },
            {
              "checkbox": {
                "size": "sm",
              },
            },
            {
              "checkbox": {
                "size": "md",
              },
            },
            {
              "checkbox": {
                "size": "lg",
              },
            },
            {
              "badge": {},
            },
            {
              "badge": {
                "size": "sm",
              },
            },
            {
              "badge": {
                "raised": "true",
              },
            },
          ],
        },
      }
    `)
  })

  test('recipe + compoundVariants', () => {
    const ctx = new Context({
      ...conf,
      config: {
        ...conf.config,
        theme: {
          recipes: {
            ...conf.config?.theme?.recipes,
            withCompound: {
              className: 'withCompound',
              base: {
                fontSize: '1px',
              },
              variants: {
                size: {
                  sm: {
                    fontSize: '2px',
                  },
                },
              },
              compoundVariants: [
                {
                  size: ['sm'],
                  css: {
                    fontSize: '3px',
                    _hover: {
                      fontSize: '4px',
                      _dark: {
                        fontSize: '5px',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    })
    const getStaticCss = (options: StaticCssOptions) => {
      const engine = ctx.staticCss.clone().process(options)
      return { results: engine.results, css: engine.sheet.toCss({ optimize: true }) }
    }

    expect(
      getStaticCss({
        recipes: {
          withCompound: ['*'],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "css": "@layer recipes {
        @layer _base {
          .withCompound {
            font-size: 1px;
      }
      }

        .withCompound--size_sm {
          font-size: 2px;
      }
      }

      @layer utilities {
        .fs_3px {
          font-size: 3px;
      }

        .hover\\:fs_4px:is(:hover, [data-hover]) {
          font-size: 4px;
      }

        [data-theme=dark] .hover\\:dark\\:fs_5px:is(:hover, [data-hover]),.dark .hover\\:dark\\:fs_5px:is(:hover, [data-hover]),.hover\\:dark\\:fs_5px:is(:hover, [data-hover]).dark,.hover\\:dark\\:fs_5px:is(:hover, [data-hover])[data-theme=dark] {
          font-size: 5px;
      }
      }",
        "results": {
          "css": [
            {
              "fontSize": "3px",
            },
            {
              "_hover": {
                "_dark": {
                  "fontSize": "5px",
                },
                "fontSize": "4px",
              },
            },
          ],
          "patterns": [],
          "recipes": [
            {
              "withCompound": {},
            },
            {
              "withCompound": {
                "size": "sm",
              },
            },
          ],
        },
      }
    `)
  })
})
