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
    return { results: engine.results, css: engine.sheet.toCss() }
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
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: white;
      }

          [data-theme=dark] .tooltipStyle[data-tooltip],.dark .tooltipStyle[data-tooltip],.tooltipStyle[data-tooltip].dark,.tooltipStyle[data-tooltip][data-theme=dark],[data-theme=dark] .tooltipStyle [data-tooltip],.dark .tooltipStyle [data-tooltip],.tooltipStyle [data-tooltip].dark,.tooltipStyle [data-tooltip][data-theme=dark] {
            color: red;
      }
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          padding: 0 0.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
      }

        @media screen and (min-width: 40rem) {
          .sm\\:buttonStyle--size_sm {
            padding: 0 0.5rem;
            height: 2.5rem;
            min-width: 2.5rem;
      }
          .sm\\:buttonStyle--size_md {
            padding: 0 0.75rem;
            height: 3rem;
            min-width: 3rem;
      }
      }

        @media screen and (min-width: 48rem) {
          .md\\:buttonStyle--size_sm {
            padding: 0 0.5rem;
            height: 2.5rem;
            min-width: 2.5rem;
      }
          .md\\:buttonStyle--size_md {
            padding: 0 0.75rem;
            height: 3rem;
            min-width: 3rem;
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

        .c_red\\.200 {
          color: var(--colors-red-200);
      }

        .c_blue\\.200 {
          color: var(--colors-blue-200);
      }

        .c_green\\.200 {
          color: var(--colors-green-200);
      }

        .c_colorPalette\\.200 {
          color: var(--colors-color-palette-200);
      }

        [data-theme=light] .light\\:c_red\\.200,.light .light\\:c_red\\.200,.light\\:c_red\\.200.light,.light\\:c_red\\.200[data-theme=light],[data-theme=dark] .dark\\:c_red\\.200,.dark .dark\\:c_red\\.200,.dark\\:c_red\\.200.dark,.dark\\:c_red\\.200[data-theme=dark] {
          color: var(--colors-red-200);
      }

        [data-theme=light] .light\\:c_blue\\.200,.light .light\\:c_blue\\.200,.light\\:c_blue\\.200.light,.light\\:c_blue\\.200[data-theme=light],[data-theme=dark] .dark\\:c_blue\\.200,.dark .dark\\:c_blue\\.200,.dark\\:c_blue\\.200.dark,.dark\\:c_blue\\.200[data-theme=dark] {
          color: var(--colors-blue-200);
      }

        [data-theme=light] .light\\:c_green\\.200,.light .light\\:c_green\\.200,.light\\:c_green\\.200.light,.light\\:c_green\\.200[data-theme=light],[data-theme=dark] .dark\\:c_green\\.200,.dark .dark\\:c_green\\.200,.dark\\:c_green\\.200.dark,.dark\\:c_green\\.200[data-theme=dark] {
          color: var(--colors-green-200);
      }

        [data-theme=light] .light\\:c_colorPalette\\.200,.light .light\\:c_colorPalette\\.200,.light\\:c_colorPalette\\.200.light,.light\\:c_colorPalette\\.200[data-theme=light],[data-theme=dark] .dark\\:c_colorPalette\\.200,.dark .dark\\:c_colorPalette\\.200,.dark\\:c_colorPalette\\.200.dark,.dark\\:c_colorPalette\\.200[data-theme=dark] {
          color: var(--colors-color-palette-200);
      }

        @media screen and (min-width: 40rem) {
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

        @media screen and (min-width: 48rem) {
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
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: white;
      }
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          padding: 0 0.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
      }

        .buttonStyle--variant_outline {
          border: 1px solid blue;
          background-color: transparent;
          color: blue;
      }

        .buttonStyle--variant_outline[data-disabled] {
          border: 1px solid gray;
          background-color: transparent;
          color: gray;
      }

        .buttonStyle--variant_outline:is(:hover, [data-hover]) {
          background-color: blue;
          color: white;
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
        .c_red\\.200 {
          color: var(--colors-red-200);
      }

        .c_blue\\.200 {
          color: var(--colors-blue-200);
      }

        .c_green\\.200 {
          color: var(--colors-green-200);
      }

        .c_colorPalette\\.200 {
          color: var(--colors-color-palette-200);
      }

        .focus\\:c_red\\.200:is(:focus, [data-focus]) {
          color: var(--colors-red-200);
      }

        .focus\\:c_blue\\.200:is(:focus, [data-focus]) {
          color: var(--colors-blue-200);
      }

        .focus\\:c_green\\.200:is(:focus, [data-focus]) {
          color: var(--colors-green-200);
      }

        .focus\\:c_colorPalette\\.200:is(:focus, [data-focus]) {
          color: var(--colors-color-palette-200);
      }

        .hover\\:c_red\\.200:is(:hover, [data-hover]) {
          color: var(--colors-red-200);
      }

        .hover\\:c_blue\\.200:is(:hover, [data-hover]) {
          color: var(--colors-blue-200);
      }

        .hover\\:c_green\\.200:is(:hover, [data-hover]) {
          color: var(--colors-green-200);
      }

        .hover\\:c_colorPalette\\.200:is(:hover, [data-hover]) {
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
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: white;
      }
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @media screen and (min-width: 48rem) {
          .md\\:buttonStyle--size_md {
            padding: 0 0.75rem;
            height: 3rem;
            min-width: 3rem;
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
            gap: 2px;
            display: flex;
            align-items: center;
      }

          .checkbox__control {
            border-width: 1px;
            border-radius: var(--radii-sm);
      }

          .checkbox__label {
            margin-inline-start: 2px;
      }
      }

        .checkbox__control--size_sm {
          font-size: 2rem;
          font-weight: var(--font-weights-bold);
          width: var(--sizes-8);
          height: var(--sizes-8);
      }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm);
      }

        .checkbox__control--size_lg {
          width: var(--sizes-12);
          height: var(--sizes-12);
      }

        .checkbox__label--size_lg {
          font-size: var(--font-sizes-lg);
      }

        @media screen and (min-width: 64rem) {
          .lg\\:checkbox__control--size_lg {
            width: var(--sizes-12);
            height: var(--sizes-12);
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
        .\\--bleed-x_token\\(spacing\\.20\\,_20\\) {
          --bleed-x: var(--spacing-20, 20);
      }

        .\\--bleed-y_token\\(spacing\\.0\\,_0\\) {
          --bleed-y: 0;
      }

        .\\--bleed-x_token\\(spacing\\.40\\,_40\\) {
          --bleed-x: var(--spacing-40, 40);
      }

        .\\--bleed-x_token\\(spacing\\.60\\,_60\\) {
          --bleed-x: var(--spacing-60, 60);
      }

        .\\--bleed-x_token\\(spacing\\.auto\\,_auto\\) {
          --bleed-x: auto;
      }

        .\\--bleed-x_token\\(spacing\\.-20\\,_-20\\) {
          --bleed-x: calc(var(--spacing-20) * -1, -20);
      }

        .\\--bleed-x_token\\(spacing\\.-40\\,_-40\\) {
          --bleed-x: calc(var(--spacing-40) * -1, -40);
      }

        .\\--bleed-x_token\\(spacing\\.-60\\,_-60\\) {
          --bleed-x: calc(var(--spacing-60) * -1, -60);
      }

        .\\--thickness_1px {
          --thickness: 1px;
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

        .flex_0_0_sm {
          flex: 0 0 sm;
      }

        .flex_0_0_md {
          flex: 0 0 md;
      }

        .flex_0_0_lg {
          flex: 0 0 lg;
      }

        .flex_0_0_auto {
          flex: 0 0 auto;
      }

        .bdr_9999px {
          border-radius: 9999px;
      }

        .mx_calc\\(var\\(--bleed-x\\,_0\\)_\\*_-1\\) {
          margin-inline: calc(var(--bleed-x, 0) * -1);
      }

        .my_calc\\(var\\(--bleed-y\\,_0\\)_\\*_-1\\) {
          margin-block: calc(var(--bleed-y, 0) * -1);
      }

        .pos_relative {
          position: relative;
      }

        .as_stretch {
          align-self: stretch;
      }

        .justify-self_stretch {
          justify-self: stretch;
      }

        .d_flex {
          display: flex;
      }

        .ai_center {
          align-items: center;
      }

        .jc_center {
          justify-content: center;
      }

        .bd-be-w_var\\(--thickness\\) {
          border-block-end-width: var(--thickness);
      }

        .bd-e-w_var\\(--thickness\\) {
          border-inline-end-width: var(--thickness);
      }

        .d_inline-flex {
          display: inline-flex;
      }

        .pos_absolute {
          position: absolute;
      }

        .inset-bs_0 {
          inset-block-start: 0;
      }

        .inset-be_auto {
          inset-block-end: auto;
      }

        .inset-s_auto {
          inset-inline-start: auto;
      }

        .inset-e_20 {
          inset-inline-end: var(--spacing-20);
      }

        .translate_50\\%_-50\\% {
          translate: 50% -50%;
      }

        .inset-e_40 {
          inset-inline-end: var(--spacing-40);
      }

        .inset-e_60 {
          inset-inline-end: var(--spacing-60);
      }

        .inset-e_-20 {
          inset-inline-end: calc(var(--spacing-20) * -1);
      }

        .inset-e_-40 {
          inset-inline-end: calc(var(--spacing-40) * -1);
      }

        .inset-e_-60 {
          inset-inline-end: calc(var(--spacing-60) * -1);
      }

        .inset-bs_20 {
          inset-block-start: var(--spacing-20);
      }

        .inset-e_0 {
          inset-inline-end: 0;
      }

        .inset-bs_40 {
          inset-block-start: var(--spacing-40);
      }

        .inset-bs_60 {
          inset-block-start: var(--spacing-60);
      }

        .inset-bs_-20 {
          inset-block-start: calc(var(--spacing-20) * -1);
      }

        .inset-bs_-40 {
          inset-block-start: calc(var(--spacing-40) * -1);
      }

        .inset-bs_-60 {
          inset-block-start: calc(var(--spacing-60) * -1);
      }

        .inset-bs_auto {
          inset-block-start: auto;
      }

        .inset-be_0 {
          inset-block-end: 0;
      }

        .translate_50\\%_50\\% {
          translate: 50% 50%;
      }

        .inset-s_0 {
          inset-inline-start: 0;
      }

        .inset-e_auto {
          inset-inline-end: auto;
      }

        .translate_-50\\%_50\\% {
          translate: -50% 50%;
      }

        .translate_-50\\%_-50\\% {
          translate: -50% -50%;
      }

        .inset-s_50\\% {
          inset-inline-start: 50%;
      }

        .inset-e_50\\% {
          inset-inline-end: 50%;
      }

        .inset-bs_50\\% {
          inset-block-start: 50%;
      }

        .inset-be_50\\% {
          inset-block-end: 50%;
      }

        .w_sm {
          width: sm;
      }

        .h_sm {
          height: sm;
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

        .w_100\\% {
          width: 100%;
      }

        .h_100\\% {
          height: 100%;
      }

        .\\[\\&\\>\\*\\]\\:inset_0>* {
          inset: 0;
      }

        .\\[\\&\\>\\*\\]\\:ov_hidden>* {
          overflow: hidden;
      }

        .before\\:content_\\"\\"::before {
          content: "";
      }

        .before\\:d_block::before {
          display: block;
      }

        .\\[\\&\\>\\*\\]\\:d_flex>* {
          display: flex;
      }

        .\\[\\&\\>\\*\\]\\:jc_center>* {
          justify-content: center;
      }

        .\\[\\&\\>\\*\\]\\:ai_center>* {
          align-items: center;
      }

        .\\[\\&\\>\\*\\]\\:pos_absolute>* {
          position: absolute;
      }

        .\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-f_cover>img,.\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-f_cover>video {
          object-fit: cover;
      }

        .before\\:h_0::before {
          height: 0;
      }

        .before\\:pb_NaN\\%::before {
          padding-bottom: NaN%;
      }

        .\\[\\&\\>\\*\\]\\:w_100\\%>* {
          width: 100%;
      }

        .\\[\\&\\>\\*\\]\\:h_100\\%>* {
          height: 100%;
      }

        @media screen and (min-width: 48rem) {
          .md\\:pos_relative {
            position: relative;
      }
          .md\\:\\[\\&\\>\\*\\]\\:inset_0>* {
            inset: 0;
      }
          .md\\:\\[\\&\\>\\*\\]\\:ov_hidden>* {
            overflow: hidden;
      }
          .md\\:before\\:content_\\"\\"::before {
            content: "";
      }
          .md\\:before\\:d_block::before {
            display: block;
      }
          .md\\:\\[\\&\\>\\*\\]\\:d_flex>* {
            display: flex;
      }
          .md\\:\\[\\&\\>\\*\\]\\:jc_center>* {
            justify-content: center;
      }
          .md\\:\\[\\&\\>\\*\\]\\:ai_center>* {
            align-items: center;
      }
          .md\\:\\[\\&\\>\\*\\]\\:pos_absolute>* {
            position: absolute;
      }
          .md\\:\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-f_cover>img,.md\\:\\[\\&\\>img\\,_\\&\\>video\\]\\:obj-f_cover>video {
            object-fit: cover;
      }
          .md\\:before\\:h_0::before {
            height: 0;
      }
          .md\\:before\\:pb_NaN\\%::before {
            padding-bottom: NaN%;
      }
          .md\\:\\[\\&\\>\\*\\]\\:w_100\\%>* {
            width: 100%;
      }
          .md\\:\\[\\&\\>\\*\\]\\:h_100\\%>* {
            height: 100%;
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
          .textStyle {
            font-family: var(--fonts-mono);
      }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
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
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: white;
      }
      }

        .textStyle--size_h1 {
          font-size: 5rem;
          line-height: 1em;
          font-weight: 800;
      }

        .textStyle--size_h2 {
          font-size: 3rem;
          line-height: 1.2em;
          font-weight: 700;
          letter-spacing: -0.03em;
      }

        .card--rounded_true {
          border-radius: 0.375rem;
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: white;
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: black;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          padding: 0 0.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
      }

        .buttonStyle--variant_outline {
          border: 1px solid blue;
          background-color: transparent;
          color: blue;
      }

        .buttonStyle--variant_outline[data-disabled] {
          border: 1px solid gray;
          background-color: transparent;
          color: gray;
      }

        .buttonStyle--variant_outline:is(:hover, [data-hover]) {
          background-color: blue;
          color: white;
      }
      }

      @layer recipes.slots {
        @layer _base {
          .checkbox__root {
            gap: 2px;
            display: flex;
            align-items: center;
      }

          .checkbox__control {
            border-width: 1px;
            border-radius: var(--radii-sm);
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
          width: var(--sizes-8);
          height: var(--sizes-8);
      }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm);
      }

        .checkbox__control--size_md {
          width: var(--sizes-10);
          height: var(--sizes-10);
      }

        .checkbox__label--size_md {
          font-size: var(--font-sizes-md);
      }

        .checkbox__control--size_lg {
          width: var(--sizes-12);
          height: var(--sizes-12);
      }

        .checkbox__label--size_lg {
          font-size: var(--font-sizes-lg);
      }

        .badge__title--size_sm {
          padding-inline: var(--spacing-4);
      }

        .badge__body--size_sm {
          color: red;
      }

        .badge__title--raised_true {
          box-shadow: var(--shadows-md);
      }
      }

      @layer utilities {
        .c_ButtonHighlight {
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
      return { results: engine.results, css: engine.sheet.toCss() }
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

  test('container query', () => {
    const ctx = new Context({
      ...conf,
      config: {
        ...conf.config,
        theme: {
          ...conf.config?.theme,
          containerNames: ['pb'],
        },
      },
    })

    const getStaticCss = (options: StaticCssOptions) => {
      const engine = ctx.staticCss.clone().process(options)
      return { results: engine.results, css: engine.sheet.toCss() }
    }

    const result = getStaticCss({
      css: [
        {
          properties: {
            fontSize: ['7xl', '8xl'],
            fontWeight: ['*'],
          },
          conditions: ['@pb/sm', '@pb/md'],
        },
      ],
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_7xl {
          font-size: var(--font-sizes-7xl);
      }

        .fs_8xl {
          font-size: var(--font-sizes-8xl);
      }

        .fw_thin {
          font-weight: var(--font-weights-thin);
      }

        .fw_extralight {
          font-weight: var(--font-weights-extralight);
      }

        .fw_light {
          font-weight: var(--font-weights-light);
      }

        .fw_normal {
          font-weight: var(--font-weights-normal);
      }

        .fw_medium {
          font-weight: var(--font-weights-medium);
      }

        .fw_semibold {
          font-weight: var(--font-weights-semibold);
      }

        .fw_bold {
          font-weight: var(--font-weights-bold);
      }

        .fw_extrabold {
          font-weight: var(--font-weights-extrabold);
      }

        .fw_black {
          font-weight: var(--font-weights-black);
      }

        @container pb (min-width: 24rem) {
          .\\@pb\\/sm\\:fs_7xl {
            font-size: var(--font-sizes-7xl);
      }
          .\\@pb\\/sm\\:fs_8xl {
            font-size: var(--font-sizes-8xl);
      }
          .\\@pb\\/sm\\:fw_thin {
            font-weight: var(--font-weights-thin);
      }
          .\\@pb\\/sm\\:fw_extralight {
            font-weight: var(--font-weights-extralight);
      }
          .\\@pb\\/sm\\:fw_light {
            font-weight: var(--font-weights-light);
      }
          .\\@pb\\/sm\\:fw_normal {
            font-weight: var(--font-weights-normal);
      }
          .\\@pb\\/sm\\:fw_medium {
            font-weight: var(--font-weights-medium);
      }
          .\\@pb\\/sm\\:fw_semibold {
            font-weight: var(--font-weights-semibold);
      }
          .\\@pb\\/sm\\:fw_bold {
            font-weight: var(--font-weights-bold);
      }
          .\\@pb\\/sm\\:fw_extrabold {
            font-weight: var(--font-weights-extrabold);
      }
          .\\@pb\\/sm\\:fw_black {
            font-weight: var(--font-weights-black);
      }
      }

        @container pb (min-width: 28rem) {
          .\\@pb\\/md\\:fs_7xl {
            font-size: var(--font-sizes-7xl);
      }
          .\\@pb\\/md\\:fs_8xl {
            font-size: var(--font-sizes-8xl);
      }
          .\\@pb\\/md\\:fw_thin {
            font-weight: var(--font-weights-thin);
      }
          .\\@pb\\/md\\:fw_extralight {
            font-weight: var(--font-weights-extralight);
      }
          .\\@pb\\/md\\:fw_light {
            font-weight: var(--font-weights-light);
      }
          .\\@pb\\/md\\:fw_normal {
            font-weight: var(--font-weights-normal);
      }
          .\\@pb\\/md\\:fw_medium {
            font-weight: var(--font-weights-medium);
      }
          .\\@pb\\/md\\:fw_semibold {
            font-weight: var(--font-weights-semibold);
      }
          .\\@pb\\/md\\:fw_bold {
            font-weight: var(--font-weights-bold);
      }
          .\\@pb\\/md\\:fw_extrabold {
            font-weight: var(--font-weights-extrabold);
      }
          .\\@pb\\/md\\:fw_black {
            font-weight: var(--font-weights-black);
      }
      }
      }"
    `)
  })

  test('arbitrary condition or selector', () => {
    const result = getStaticCss({
      css: [
        {
          properties: {
            fontSize: ['7xl', '8xl'],
          },
          conditions: ['@media (min-width: 24rem)', '.mobile &'],
        },
      ],
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_7xl {
          font-size: var(--font-sizes-7xl);
      }

        .fs_8xl {
          font-size: var(--font-sizes-8xl);
      }

        .mobile .\\[\\.mobile_\\&\\]\\:fs_7xl {
          font-size: var(--font-sizes-7xl);
      }

        .mobile .\\[\\.mobile_\\&\\]\\:fs_8xl {
          font-size: var(--font-sizes-8xl);
      }

        @media (min-width: 24rem) {
          .\\[\\@media_\\(min-width\\:_24rem\\)\\]\\:fs_7xl {
            font-size: var(--font-sizes-7xl);
      }
          .\\[\\@media_\\(min-width\\:_24rem\\)\\]\\:fs_8xl {
            font-size: var(--font-sizes-8xl);
      }
      }
      }"
    `)
  })
})

describe('static-css caching', () => {
  // Setup with limited tokens for faster tests
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
  }

  const ctx = new Context(conf)

  test('cache hit on unchanged staticCss config', () => {
    const options = {
      css: [{ properties: { color: ['*'] } }],
      recipes: {
        buttonStyle: [{ size: ['md'] }],
      },
    }

    // First call - cache miss, should process
    const result1 = ctx.staticCss.process(options)
    const css1 = result1.sheet.toCss()

    // Second call with same options - cache hit, should reuse
    const result2 = ctx.staticCss.process(options)
    const css2 = result2.sheet.toCss()

    // Results should be identical
    expect(css1).toBe(css2)
    expect(result1.results).toEqual(result2.results)
  })

  test('cache miss on changed CSS rules', () => {
    const options1 = {
      css: [{ properties: { color: ['red.200'] } }],
    }

    const options2 = {
      css: [{ properties: { color: ['blue.200'] } }],
    }

    // Use a fresh clone to test cache miss detection
    const staticCss = ctx.staticCss.clone()

    const result1 = staticCss.process(options1)
    const css1 = result1.sheet.toCss()

    const result2 = staticCss.process(options2)
    const css2 = result2.sheet.toCss()

    // Results should be different
    expect(css1).not.toBe(css2)
    expect(css1).toContain('red')
    expect(css2).toContain('blue')
  })

  test('cache handles wildcard expansions', () => {
    const options = {
      css: [{ properties: { color: ['*'] } }],
    }

    // First call - expands wildcards
    const result1 = ctx.staticCss.process(options)
    expect(result1.results.css.length).toBeGreaterThan(0)

    // Second call with same options - should use cache
    const result2 = ctx.staticCss.process(options)
    expect(result1.results).toEqual(result2.results)
  })

  test('cache persists across multiple calls', () => {
    const options = {
      css: [{ properties: { margin: ['20px', '40px'] } }],
    }

    // Multiple calls with same options
    const result1 = ctx.staticCss.process(options)
    const result2 = ctx.staticCss.process(options)
    const result3 = ctx.staticCss.process(options)

    // All should produce identical results
    expect(result1.results).toEqual(result2.results)
    expect(result2.results).toEqual(result3.results)
  })

  test('wildcard expansion is memoized across calls', () => {
    const options = {
      css: [{ properties: { fontSize: ['*'] } }],
    }

    const staticCss = ctx.staticCss.clone()

    // First call expands wildcards
    const result1 = staticCss.process(options)
    const count1 = result1.results.css.length

    // Second call should reuse memoized expansion
    const result2 = staticCss.process(options)
    const count2 = result2.results.css.length

    // Should produce same results
    expect(count1).toBe(count2)
    expect(count1).toBeGreaterThan(0)
  })

  test('recipes: "*" should override individual recipe staticCss config', () => {
    // Create a context with a recipe that has its own staticCss config
    const confWithRecipeStaticCss = {
      hooks,
      ...defaults,
      config: {
        ...defaults.config,
        theme: {
          ...JSON.parse(JSON.stringify(defaults.config.theme)),
          recipes: {
            testRecipe: {
              className: 'testRecipe',
              base: { display: 'flex' },
              variants: {
                size: {
                  sm: { fontSize: '12px' },
                  md: { fontSize: '14px' },
                  lg: { fontSize: '16px' },
                },
                variant: {
                  primary: { color: 'blue' },
                  secondary: { color: 'gray' },
                },
              },
              // This recipe has its own staticCss config that only includes 'sm' size
              staticCss: [{ size: ['sm'] }],
            },
          },
        },
      },
    } as typeof fixtureDefaults

    const ctxWithStaticCss = new Context(confWithRecipeStaticCss)
    const getStaticCssWithCtx = (options: StaticCssOptions) => {
      const engine = ctxWithStaticCss.staticCss.clone().process(options)
      return { results: engine.results, css: engine.sheet.toCss() }
    }

    // When using recipes: "*", ALL variants should be generated
    // even though the recipe's staticCss only specifies ['sm']
    const result = getStaticCssWithCtx({ recipes: '*' })

    // Should include all size variants (sm, md, lg), not just sm
    expect(result.css).toContain('testRecipe--size_sm')
    expect(result.css).toContain('testRecipe--size_md')
    expect(result.css).toContain('testRecipe--size_lg')

    // Should include all variant variants (primary, secondary)
    expect(result.css).toContain('testRecipe--variant_primary')
    expect(result.css).toContain('testRecipe--variant_secondary')
  })
})
