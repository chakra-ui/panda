import { createGeneratorContext } from '@pandacss/fixture'
import type { Config, Dict, RecipeDefinition, SlotRecipeDefinition } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { RuleProcessor } from '../src/rule-processor'
import { createRuleProcessor } from './fixture'

const css = (styles: Dict, config?: Config) => {
  const result = createRuleProcessor(config).css(styles)
  return { className: result.getClassNames(), css: result.toCss() }
}

const recipe = (name: string, styles: Dict) => {
  const result = createRuleProcessor().recipe(name, styles)!
  return { className: result.getClassNames(), css: result.toCss() }
}

const cva = (styles: RecipeDefinition) => {
  const result = createRuleProcessor().cva(styles)!
  return { className: result.getClassNames(), css: result.toCss() }
}

const sva = (styles: SlotRecipeDefinition) => {
  const result = createRuleProcessor().sva(styles)!
  return { className: result.getClassNames(), css: result.toCss() }
}

const buttonRecipe = {
  className: 'btn',
  base: {
    lineHeight: '1.2',
    _focusVisible: {
      boxShadow: 'outline',
    },
    _disabled: {
      opacity: 0.4,
    },
    _hover: {
      _disabled: { bg: 'initial' },
    },
    display: 'inline-flex',
    outline: 'none',
    _focus: {
      zIndex: 1,
    },
  },
}

describe('rule processor', () => {
  test('simple', () => {
    const result = css({
      margin: 2,
      mx: 'token(spacing.2)',
      my: '-2',
      color: 'blue.300',
    })
    expect(result.className).toMatchInlineSnapshot(`
      [
        "m_2",
        "mx_token\\(spacing\\.2\\)",
        "my_-2",
        "c_blue\\.300",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_2 {
          margin: var(--spacing-2);
      }

        .mx_token\\(spacing\\.2\\) {
          margin-inline: var(--spacing-2);
      }

        .my_-2 {
          margin-block: calc(var(--spacing-2) * -1);
      }

        .c_blue\\.300 {
          color: var(--colors-blue-300);
      }
      }"
    `)
  })

  test('simple with formatTokenName', () => {
    const result = css(
      {
        margin: '$2',
        p: '{$spacing-2}',
        mx: 'token($spacing-2)',
        my: '-$2',
        color: '$blue-300',
      },
      {
        hooks: {
          'tokens:created': ({ configure }) => {
            configure({
              formatTokenName: (path: string[]) => '$' + path.join('-'),
            })
          },
        },
      },
    )
    expect(result.className).toMatchInlineSnapshot(`
      [
        "m_\\$2",
        "p_\\{\\$spacing-2\\}",
        "mx_token\\(\\$spacing-2\\)",
        "my_-\\$2",
        "c_\\$blue-300",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_\\$2 {
          margin: var(--spacing-2);
      }

        .p_\\{\\$spacing-2\\} {
          padding: var(--spacing-2);
      }

        .mx_token\\(\\$spacing-2\\) {
          margin-inline: var(--spacing-2);
      }

        .my_-\\$2 {
          margin-block: calc(var(--spacing-2) * -1);
      }

        .c_\\$blue-300 {
          color: var(--colors-blue-300);
      }
      }"
    `)
  })

  test('token() with formatTokenName', () => {
    const result = css(
      {
        mx: 'token($spacing-2)',
      },
      {
        hooks: {
          'tokens:created': ({ configure }) => {
            configure({
              formatTokenName: (path: string[]) => '$' + path.join('-'),
            })
          },
        },
      },
    )
    expect(result.className).toMatchInlineSnapshot(`
      [
        "mx_token\\(\\$spacing-2\\)",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .mx_token\\(\\$spacing-2\\) {
          margin-inline: var(--spacing-2);
      }
      }"
    `)
  })

  test('simple - hash: true', () => {
    const result = css(
      {
        margin: 2,
        mx: 'token(spacing.2)',
        my: '-2',
        color: 'blue.300',
      },
      { hash: true },
    )
    expect(result.className).toMatchInlineSnapshot(`
      [
        "AxiDH",
        "hHAKfe",
        "pWVwj",
        "hDAFEs",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .AxiDH {
          margin: var(--ebuyxV);
      }

        .hHAKfe {
          margin-inline: var(--ebuyxV);
      }

        .pWVwj {
          margin-block: calc(var(--ebuyxV) * -1);
      }

        .hDAFEs {
          color: var(--bMEoOM);
      }
      }"
    `)
  })

  test('simple - hash: true + custom toHash', () => {
    const result = css(
      {
        margin: 2,
        mx: 'token(spacing.2)',
        my: '-2',
        color: 'blue.300',
      },
      {
        hash: true,
        hooks: {
          'utility:created': ({ configure }) => {
            configure({
              toHash(paths, toHash) {
                const stringConds = paths.join(':')
                const splitConds = stringConds.split('_')
                const hashConds = splitConds.map(toHash)
                return hashConds.join('_')
              },
            })
          },
        },
      },
    )
    expect(result.className).toMatchInlineSnapshot(`
      [
        "bnJC_bnIF",
        "PJOa_hhWZwA",
        "PJOH_PIXg",
        "bnJA_bNBgpA",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bnJC_bnIF {
          margin: var(--ebuyxV);
      }

        .PJOa_hhWZwA {
          margin-inline: var(--ebuyxV);
      }

        .PJOH_PIXg {
          margin-block: calc(var(--ebuyxV) * -1);
      }

        .bnJA_bNBgpA {
          color: var(--bMEoOM);
      }
      }"
    `)
  })

  test('css', () => {
    const result = css({
      color: 'red !important',
      border: '1px solid token(colors.red.100)',
      bg: 'blue.300',
      textStyle: 'headline.h1',
      w: [1, 2, undefined, null, 3],
      fontSize: {
        base: 'xs',
        sm: 'sm',
        _hover: {
          base: 'md',
          md: 'lg',
          _focus: 'xl',
        },
        _dark: '2xl',
      },
      sm: {
        color: 'yellow',
        backgroundColor: {
          base: 'red',
          _hover: 'green',
        },
      },
      "&[data-attr='test']": {
        color: 'green',
        _expanded: {
          color: 'purple',
          '.target &': {
            color: {
              base: 'cyan',
              _open: 'orange',
              xl: 'pink',
            },
          },
        },
      },
    })

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "bd_1px_solid_token\\(colors\\.red\\.100\\)",
        "bg_blue\\.300",
        "c_red",
        "textStyle_headline\\.h1",
        "fs_xs",
        "w_1",
        "dark\\:fs_2xl",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:c_green",
        "hover\\:fs_md",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:c_purple",
        "hover\\:focus\\:fs_xl",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:c_cyan",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:open\\:c_orange",
        "sm\\:fs_sm",
        "sm\\:c_yellow",
        "sm\\:bg-c_red",
        "sm\\:w_2",
        "sm\\:hover\\:bg-c_green",
        "hover\\:md\\:fs_lg",
        "xl\\:w_3",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:xl\\:c_pink",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @layer compositions {
          .textStyle_headline\\.h1 {
            font-size: 2rem;
            font-weight: var(--font-weights-bold);
      }
      }

        .bd_1px_solid_token\\(colors\\.red\\.100\\) {
          border: 1px solid var(--colors-red-100);
      }

        .bg_blue\\.300 {
          background: var(--colors-blue-300);
      }

        .c_red\\! {
          color: red !important;
      }

        .fs_xs {
          font-size: var(--font-sizes-xs);
      }

        .w_1 {
          width: var(--sizes-1);
      }

        [data-theme=dark] .dark\\:fs_2xl,.dark .dark\\:fs_2xl,.dark\\:fs_2xl.dark,.dark\\:fs_2xl[data-theme=dark] {
          font-size: var(--font-sizes-2xl);
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:c_green[data-attr='test'] {
          color: green;
      }

        .hover\\:fs_md:is(:hover, [data-hover]) {
          font-size: var(--font-sizes-md);
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:c_purple[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
          color: purple;
      }

        .hover\\:focus\\:fs_xl:is(:hover, [data-hover]):is(:focus, [data-focus]) {
          font-size: var(--font-sizes-xl);
      }

        .target .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:c_cyan[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
          color: cyan;
      }

        .target .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:open\\:c_orange[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):is([open], [data-open], [data-state="open"]) {
          color: orange;
      }

        @media screen and (min-width: 40rem) {
          .sm\\:fs_sm {
            font-size: var(--font-sizes-sm);
      }
          .sm\\:c_yellow {
            color: yellow;
      }
          .sm\\:bg-c_red {
            background-color: red;
      }
          .sm\\:w_2 {
            width: var(--sizes-2);
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:hover\\:bg-c_green:is(:hover, [data-hover]) {
            background-color: green;
      }
      }

        @media screen and (min-width: 48rem) {
          .hover\\:md\\:fs_lg:is(:hover, [data-hover]) {
            font-size: var(--font-sizes-lg);
      }
      }

        @media screen and (min-width: 80rem) {
          .xl\\:w_3 {
            width: var(--sizes-3);
      }
      }

        @media screen and (min-width: 80rem) {
          .target .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:xl\\:c_pink[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
            color: pink;
      }
      }
      }"
    `)
  })

  test('recipe', () => {
    const result = recipe('buttonStyle', { size: { base: 'sm', md: 'md' } })

    expect(result.className).toMatchInlineSnapshot(`
      [
        "buttonStyle--size_sm",
        "md\\:buttonStyle--size_md",
        "buttonStyle--variant_solid",
        "buttonStyle",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: var(--colors-white);
      }
      }

        .buttonStyle--size_sm {
          padding: 0 0.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black);
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
      }"
    `)
  })

  test('cva', () => {
    // packages/fixture/src/recipes.ts
    const buttonStyle = cva({
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      variants: {
        size: {
          sm: {
            textStyle: 'headline.h1',
            height: '2.5rem',
            minWidth: '2.5rem',
            padding: '0 0.5rem',
          },
          md: {
            height: '3rem',
            minWidth: '3rem',
            padding: '0 0.75rem',
          },
        },
        variant: {
          solid: {
            backgroundColor: 'blue',
            color: 'white',
            _hover: {
              backgroundColor: 'darkblue',
            },
            '&[data-disabled]': {
              backgroundColor: 'gray',
              color: 'black',
            },
          },
          outline: {
            backgroundColor: 'transparent',
            border: '1px solid blue',
            color: 'blue',
            _hover: {
              backgroundColor: 'blue',
              color: 'white',
            },
            '&[data-disabled]': {
              backgroundColor: 'transparent',
              border: '1px solid gray',
              color: 'gray',
            },
          },
        },
      },
      defaultVariants: {
        size: 'md',
        variant: 'solid',
      },
    })

    expect(buttonStyle.className).toMatchInlineSnapshot(`
      [
        "p_0_0\\.5rem",
        "p_0_0\\.75rem",
        "bd_1px_solid_blue",
        "d_inline-flex",
        "ai_center",
        "jc_center",
        "textStyle_headline\\.h1",
        "bg-c_blue",
        "c_white",
        "bg-c_transparent",
        "c_blue",
        "h_2\\.5rem",
        "min-w_2\\.5rem",
        "h_3rem",
        "min-w_3rem",
        "\\[\\&\\[data-disabled\\]\\]\\:bd_1px_solid_gray",
        "\\[\\&\\[data-disabled\\]\\]\\:bg-c_gray",
        "\\[\\&\\[data-disabled\\]\\]\\:c_black",
        "\\[\\&\\[data-disabled\\]\\]\\:bg-c_transparent",
        "\\[\\&\\[data-disabled\\]\\]\\:c_gray",
        "hover\\:bg-c_darkblue",
        "hover\\:bg-c_blue",
        "hover\\:c_white",
      ]
    `)
    expect(buttonStyle.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @layer compositions {
          .textStyle_headline\\.h1 {
            font-size: 2rem;
            font-weight: var(--font-weights-bold);
      }
      }

        .p_0_0\\.5rem {
          padding: 0 0.5rem;
      }

        .p_0_0\\.75rem {
          padding: 0 0.75rem;
      }

        .bd_1px_solid_blue {
          border: 1px solid blue;
      }

        .d_inline-flex {
          display: inline-flex;
      }

        .ai_center {
          align-items: center;
      }

        .jc_center {
          justify-content: center;
      }

        .bg-c_blue {
          background-color: blue;
      }

        .c_white {
          color: var(--colors-white);
      }

        .bg-c_transparent {
          background-color: var(--colors-transparent);
      }

        .c_blue {
          color: blue;
      }

        .h_2\\.5rem {
          height: 2.5rem;
      }

        .min-w_2\\.5rem {
          min-width: 2.5rem;
      }

        .h_3rem {
          height: 3rem;
      }

        .min-w_3rem {
          min-width: 3rem;
      }

        .\\[\\&\\[data-disabled\\]\\]\\:bd_1px_solid_gray[data-disabled] {
          border: 1px solid gray;
      }

        .\\[\\&\\[data-disabled\\]\\]\\:bg-c_gray[data-disabled] {
          background-color: gray;
      }

        .\\[\\&\\[data-disabled\\]\\]\\:c_black[data-disabled] {
          color: var(--colors-black);
      }

        .\\[\\&\\[data-disabled\\]\\]\\:bg-c_transparent[data-disabled] {
          background-color: var(--colors-transparent);
      }

        .\\[\\&\\[data-disabled\\]\\]\\:c_gray[data-disabled] {
          color: gray;
      }

        .hover\\:bg-c_darkblue:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .hover\\:bg-c_blue:is(:hover, [data-hover]) {
          background-color: blue;
      }

        .hover\\:c_white:is(:hover, [data-hover]) {
          color: var(--colors-white);
      }
      }"
    `)
  })

  test('slot recipe', () => {
    const result = recipe('checkbox', { size: { base: 'sm', md: 'md' } })

    expect(result.className).toMatchInlineSnapshot(`
      [
        "checkbox__root--size_sm",
        "checkbox__control--size_sm",
        "checkbox__label--size_sm",
        "md\\:checkbox__root--size_md",
        "md\\:checkbox__control--size_md",
        "md\\:checkbox__label--size_md",
        "checkbox__root",
        "checkbox__control",
        "checkbox__label",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .checkbox__root {
            gap: var(--spacing-2);
            display: flex;
            align-items: center;
      }

          .checkbox__control {
            border-width: 1px;
            border-radius: var(--radii-sm);
      }

          .checkbox__label {
            margin-inline-start: var(--spacing-2);
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

        @media screen and (min-width: 48rem) {
          .md\\:checkbox__control--size_md {
            width: var(--sizes-10);
            height: var(--sizes-10);
      }
          .md\\:checkbox__label--size_md {
            font-size: var(--font-sizes-md);
      }
      }
      }"
    `)
  })

  test('sva', () => {
    // packages/fixture/src/slot-recipes.ts
    const checkbox = sva({
      slots: ['root', 'control', 'label'],
      base: {
        root: { display: 'flex', alignItems: 'center', gap: '2' },
        control: { borderWidth: '1px', borderRadius: 'sm' },
        label: { marginStart: '2' },
      },
      variants: {
        size: {
          sm: {
            control: { width: '8', height: '8' },
            label: { fontSize: 'sm' },
          },
          md: {
            control: { width: '10', height: '10' },
            label: { fontSize: 'md' },
          },
          lg: {
            control: { width: '12', height: '12' },
            label: { fontSize: 'lg' },
          },
        },
      },
      defaultVariants: {
        size: 'sm',
      },
    })

    expect(checkbox.className).toMatchInlineSnapshot(`
      [
        "gap_2",
        "bd-w_1px",
        "bdr_sm",
        "d_flex",
        "ai_center",
        "ms_2",
        "fs_sm",
        "fs_md",
        "fs_lg",
        "w_8",
        "h_8",
        "w_10",
        "h_10",
        "w_12",
        "h_12",
      ]
    `)
    expect(checkbox.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .gap_2 {
          gap: var(--spacing-2);
      }

        .bd-w_1px {
          border-width: 1px;
      }

        .bdr_sm {
          border-radius: var(--radii-sm);
      }

        .d_flex {
          display: flex;
      }

        .ai_center {
          align-items: center;
      }

        .ms_2 {
          margin-inline-start: var(--spacing-2);
      }

        .fs_sm {
          font-size: var(--font-sizes-sm);
      }

        .fs_md {
          font-size: var(--font-sizes-md);
      }

        .fs_lg {
          font-size: var(--font-sizes-lg);
      }

        .w_8 {
          width: var(--sizes-8);
      }

        .h_8 {
          height: var(--sizes-8);
      }

        .w_10 {
          width: var(--sizes-10);
      }

        .h_10 {
          height: var(--sizes-10);
      }

        .w_12 {
          width: var(--sizes-12);
      }

        .h_12 {
          height: var(--sizes-12);
      }
      }"
    `)
  })

  test('simple recipe with alterning no-condition/condition props', () => {
    const processor = createRuleProcessor({
      theme: {
        extend: {
          recipes: {
            button: buttonRecipe,
          },
        },
      },
    })

    const result = processor.recipe('button', {})!
    expect(result.getClassNames()).toMatchInlineSnapshot(`
      [
        "btn",
      ]
    `)
    expect(result.toCss()).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .btn {
            outline: var(--borders-none);
            line-height: 1.2;
            display: inline-flex;
      }

          .btn:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
            opacity: 0.4;
      }

          .btn:is(:focus-visible, [data-focus-visible]) {
            box-shadow: outline;
      }

          .btn:is(:focus, [data-focus]) {
            z-index: 1;
      }

          .btn:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
            background: initial;
      }
          }
      }"
    `)
  })

  test('mixed together', () => {
    const processor = createRuleProcessor({
      theme: {
        extend: {
          recipes: {
            button: buttonRecipe,
          },
        },
      },
    })
    processor.clone()
    processor.css({
      color: 'blue.300',
      _hover: {
        color: 'red.400',
      },
    })

    processor.recipe('button', {
      size: {
        base: 'sm',
        md: 'md',
      },
      variant: 'solid',
    })

    processor.cva({
      base: {
        fontSize: '12px',
      },
      variants: {
        size: {
          sm: {
            fontSize: '14px',
          },
          md: {
            fontSize: '16px',
          },
        },
      },
      compoundVariants: [
        {
          size: 'sm',
          css: {
            border: '2px solid token(colors.green.100)',
          } as any,
        },
      ],
    })

    expect(processor.toCss()).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .btn {
            outline: var(--borders-none);
            line-height: 1.2;
            display: inline-flex;
      }

          .btn:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
            opacity: 0.4;
      }

          .btn:is(:focus-visible, [data-focus-visible]) {
            box-shadow: outline;
      }

          .btn:is(:focus, [data-focus]) {
            z-index: 1;
      }

          .btn:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
            background: initial;
      }
      }
      }

      @layer utilities {
        .bd_2px_solid_token\\(colors\\.green\\.100\\) {
          border: 2px solid var(--colors-green-100);
      }

        .c_blue\\.300 {
          color: var(--colors-blue-300);
      }

        .fs_12px {
          font-size: 12px;
      }

        .fs_14px {
          font-size: 14px;
      }

        .fs_16px {
          font-size: 16px;
      }

        .hover\\:c_red\\.400:is(:hover, [data-hover]) {
          color: var(--colors-red-400);
      }
      }"
    `)
  })

  test('fromJSON', () => {
    const ctx = createGeneratorContext()
    const processor = new RuleProcessor(ctx as any)

    const step1 = processor.clone()

    step1.encoder.fromJSON({
      schemaVersion: 'x',
      styles: { atomic: ['color]___[value:red', 'color]___[value:blue'] },
    })

    step1.decoder.collect(step1.encoder)

    expect(processor.toCss()).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red {
          color: red;
      }

        .c_blue {
          color: blue;
      }
      }"
    `)

    const step2 = processor.clone()

    step2.encoder.fromJSON({
      schemaVersion: 'x',
      styles: { recipes: { buttonStyle: ['variant]___[value:solid'] } },
    })

    step2.decoder.collect(step2.encoder)

    expect(processor.toCss()).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: var(--colors-white);
      }
      }

        .variant_solid {
          variant: solid;
      }
      }"
    `)

    const step3 = processor.clone()

    step3.encoder.fromJSON({
      schemaVersion: 'x',
      styles: {
        atomic: [
          'display]___[value:none',
          'height]___[value:100%',
          'transition]___[value:all .3s ease-in-out',
          'opacity]___[value:0 !important',
          'opacity]___[value:1',
          'height]___[value:10px',
          'backgroundGradient]___[value:to-b',
          'gradientFrom]___[value:rgb(200 200 200 / .4)',
        ],
        recipes: {
          checkbox: [
            'size]___[value:md]___[recipe:checkbox]___[slot:container',
            'size]___[value:md]___[recipe:checkbox]___[slot:control',
            'size]___[value:md]___[recipe:checkbox]___[slot:label',
          ],
        },
      },
    })

    step3.decoder.collect(step3.encoder)
    expect(step3.toCss()).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .checkbox__root {
            gap: var(--spacing-2);
            display: flex;
            align-items: center;
      }

          .checkbox__control {
            border-width: 1px;
            border-radius: var(--radii-sm);
      }

          .checkbox__label {
            margin-inline-start: var(--spacing-2);
      }
      }

        .checkbox__control--size_md {
          width: var(--sizes-10);
          height: var(--sizes-10);
      }

        .checkbox__label--size_md {
          font-size: var(--font-sizes-md);
      }
      }

      @layer utilities {
        .trs_all_\\.3s_ease-in-out {
          transition: all .3s ease-in-out;
      }

        .d_none {
          display: none;
      }

        .op_0\\! {
          opacity: 0 !important;
      }

        .op_1 {
          opacity: 1;
      }

        .bg-grad_to-b {
          --gradient-stops: var(--gradient-via-stops, var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position));
          --gradient: var(--gradient-via-stops, var(--gradient-stops));
          background-image: linear-gradient(to bottom, var(--gradient));
      }

        .grad-from_rgb\\(200_200_200_\\/_\\.4\\) {
          --gradient-from: rgb(200 200 200 / .4);
      }

        .h_100\\% {
          height: 100%;
      }

        .h_10px {
          height: 10px;
      }
      }"
    `)
  })

  test('css - boolean utility', () => {
    const result = css({ truncate: false })
    expect(result).toMatchInlineSnapshot(`
      {
        "className": [
          "trunc_false",
        ],
        "css": "",
      }
    `)

    const result2 = css({ truncate: true })
    expect(result2).toMatchInlineSnapshot(`
      {
        "className": [
          "trunc_true",
        ],
        "css": "@layer utilities {
        .trunc_true {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
      }
      }",
      }
    `)
  })

  test('cva - boolean variant', () => {
    const result = cva({
      base: {
        color: '#fff',
      },
      variants: {
        checked: {
          true: {
            display: 'block',
          },
          false: {
            display: 'none',
          },
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "className": [
          "c_\\#fff",
          "d_block",
          "d_none",
        ],
        "css": "@layer utilities {
        .c_\\#fff {
          color: #fff;
      }

        .d_block {
          display: block;
      }

        .d_none {
          display: none;
      }
      }",
      }
    `)
  })
})

describe('js to css', () => {
  test('ignores declarations with null', () => {
    const result = css({
      font: undefined,
      color: null,
      background: false,
    })

    expect(result.css).toMatchInlineSnapshot('""')
  })

  test('unitless', () => {
    const result = css({
      '--foo': 42,
      width: 42,
      opacity: 1,
      zIndex: 0,
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\--foo_42 {
          --foo: 42;
      }

        .op_1 {
          opacity: 1;
      }

        .z_0 {
          z-index: 0;
      }

        .w_42 {
          width: 42px;
      }
      }"
    `)
  })

  test('preserves casing for css variable', () => {
    const result = css({
      '--testVariable0': '0',
      '--test-Variable-1': '1',
      '--test-variable-2': '2',
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\--testVariable0_0 {
          --testVariable0: 0;
      }

        .\\--test-Variable-1_1 {
          --test-Variable-1: 1;
      }

        .\\--test-variable-2_2 {
          --test-variable-2: 2;
      }
      }"
    `)
  })

  test('parses declarations with !important', () => {
    const result = css({
      borderColor: 'red !important',
      color: 'pink!',
      background: 'white!IMPORTANT  ',
      fontFamily: 'A',
    })

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_white\\! {
          background: var(--colors-white) !important;
      }

        .bd-c_red\\! {
          border-color: red !important;
      }

        .c_pink\\! {
          color: pink !important;
      }

        .ff_A {
          font-family: A;
      }
      }"
    `)
  })

  test('color mix', () => {
    expect(css({ bg: 'red.300/40', color: 'white' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\.300\\/40",
          "c_white",
        ],
        "css": "@layer utilities {
        .bg_red\\.300\\/40 {
          --mix-background: color-mix(in srgb, var(--colors-red-300) 40%, transparent);
          background: var(--mix-background, var(--colors-red-300));
      }

        .c_white {
          color: var(--colors-white);
      }
      }",
      }
    `)
  })

  test('resolve property conflicts and order - border example', () => {
    const result = css({
      borderWidth: '1px',
      borderTopRadius: '0px',
      borderBottomWidth: '3px',
      overflow: 'hidden',
      base: {
        borderWidth: '2px',
      },
    })
    expect(result.className).toMatchInlineSnapshot(`
      [
        "bd-w_1px",
        "ov_hidden",
        "bd-w_2px",
        "bdr-t_0px",
        "bd-b-w_3px",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bd-w_1px {
          border-width: 1px;
      }

        .ov_hidden {
          overflow: hidden;
      }

        .bd-w_2px {
          border-width: 2px;
      }

        .bdr-t_0px {
          border-top-left-radius: 0px;
          border-top-right-radius: 0px;
      }

        .bd-b-w_3px {
          border-bottom-width: 3px;
      }
      }"
    `)
  })

  test('resolve property conflicts and order - padding example', () => {
    const result = css({
      padding: '1px',
      paddingTop: '3px',
      paddingBottom: '4px',
      base: {
        padding: '2px',
      },
    })
    expect(result.className).toMatchInlineSnapshot(`
      [
        "p_1px",
        "p_2px",
        "pt_3px",
        "pb_4px",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_1px {
          padding: 1px;
      }

        .p_2px {
          padding: 2px;
      }

        .pt_3px {
          padding-top: 3px;
      }

        .pb_4px {
          padding-bottom: 4px;
      }
      }"
    `)
  })

  test('more specific should always be last (red then blue)', () => {
    const result = css({
      backgroundColor: 'blue',
      background: 'red',
      _hover: {
        background: 'red',
        backgroundColor: 'blue',
      },
      _focus: {
        background: 'red',
        backgroundColor: 'blue',
      },
      _dark: {
        backgroundColor: 'blue',
        background: 'red',
      },
      md: {
        backgroundColor: 'blue',
        background: 'red',
        _light: {
          backgroundColor: 'blue',
          background: 'red',
          _hover: {
            backgroundColor: 'blue',
            background: 'red',
          },
          _focus: {
            background: 'red',
            backgroundColor: 'blue',
          },
          _active: {
            bgColor: 'blue',
            bg: 'red',
          },
        },
      },
    })
    expect(result.className).toMatchInlineSnapshot(`
      [
        "bg_red",
        "bg-c_blue",
        "dark\\:bg_red",
        "dark\\:bg-c_blue",
        "focus\\:bg_red",
        "focus\\:bg-c_blue",
        "hover\\:bg_red",
        "hover\\:bg-c_blue",
        "md\\:bg_red",
        "md\\:bg-c_blue",
        "md\\:light\\:bg_red",
        "md\\:light\\:bg-c_blue",
        "md\\:light\\:focus\\:bg_red",
        "md\\:light\\:focus\\:bg-c_blue",
        "md\\:light\\:hover\\:bg_red",
        "md\\:light\\:hover\\:bg-c_blue",
        "md\\:light\\:active\\:bg_red",
        "md\\:light\\:active\\:bg-c_blue",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red {
          background: red;
      }

        .bg-c_blue {
          background-color: blue;
      }

        [data-theme=dark] .dark\\:bg_red,.dark .dark\\:bg_red,.dark\\:bg_red.dark,.dark\\:bg_red[data-theme=dark] {
          background: red;
      }

        [data-theme=dark] .dark\\:bg-c_blue,.dark .dark\\:bg-c_blue,.dark\\:bg-c_blue.dark,.dark\\:bg-c_blue[data-theme=dark] {
          background-color: blue;
      }

        .focus\\:bg_red:is(:focus, [data-focus]) {
          background: red;
      }

        .focus\\:bg-c_blue:is(:focus, [data-focus]) {
          background-color: blue;
      }

        .hover\\:bg_red:is(:hover, [data-hover]) {
          background: red;
      }

        .hover\\:bg-c_blue:is(:hover, [data-hover]) {
          background-color: blue;
      }

        @media screen and (min-width: 48rem) {
          .md\\:bg_red {
            background: red;
      }
          .md\\:bg-c_blue {
            background-color: blue;
      }
          [data-theme=light] .md\\:light\\:bg_red,.light .md\\:light\\:bg_red,.md\\:light\\:bg_red.light,.md\\:light\\:bg_red[data-theme=light] {
            background: red;
      }
          [data-theme=light] .md\\:light\\:bg-c_blue,.light .md\\:light\\:bg-c_blue,.md\\:light\\:bg-c_blue.light,.md\\:light\\:bg-c_blue[data-theme=light] {
            background-color: blue;
      }
      }

        @media screen and (min-width: 48rem) {
          [data-theme=light] .md\\:light\\:focus\\:bg_red:is(:focus, [data-focus]),.light .md\\:light\\:focus\\:bg_red:is(:focus, [data-focus]),.md\\:light\\:focus\\:bg_red:is(:focus, [data-focus]).light,.md\\:light\\:focus\\:bg_red:is(:focus, [data-focus])[data-theme=light] {
            background: red;
      }
      }

        @media screen and (min-width: 48rem) {
          [data-theme=light] .md\\:light\\:focus\\:bg-c_blue:is(:focus, [data-focus]),.light .md\\:light\\:focus\\:bg-c_blue:is(:focus, [data-focus]),.md\\:light\\:focus\\:bg-c_blue:is(:focus, [data-focus]).light,.md\\:light\\:focus\\:bg-c_blue:is(:focus, [data-focus])[data-theme=light] {
            background-color: blue;
      }
      }

        @media screen and (min-width: 48rem) {
          [data-theme=light] .md\\:light\\:hover\\:bg_red:is(:hover, [data-hover]),.light .md\\:light\\:hover\\:bg_red:is(:hover, [data-hover]),.md\\:light\\:hover\\:bg_red:is(:hover, [data-hover]).light,.md\\:light\\:hover\\:bg_red:is(:hover, [data-hover])[data-theme=light] {
            background: red;
      }
      }

        @media screen and (min-width: 48rem) {
          [data-theme=light] .md\\:light\\:hover\\:bg-c_blue:is(:hover, [data-hover]),.light .md\\:light\\:hover\\:bg-c_blue:is(:hover, [data-hover]),.md\\:light\\:hover\\:bg-c_blue:is(:hover, [data-hover]).light,.md\\:light\\:hover\\:bg-c_blue:is(:hover, [data-hover])[data-theme=light] {
            background-color: blue;
      }
      }

        @media screen and (min-width: 48rem) {
          [data-theme=light] .md\\:light\\:active\\:bg_red:is(:active, [data-active]),.light .md\\:light\\:active\\:bg_red:is(:active, [data-active]),.md\\:light\\:active\\:bg_red:is(:active, [data-active]).light,.md\\:light\\:active\\:bg_red:is(:active, [data-active])[data-theme=light] {
            background: red;
      }
      }

        @media screen and (min-width: 48rem) {
          [data-theme=light] .md\\:light\\:active\\:bg-c_blue:is(:active, [data-active]),.light .md\\:light\\:active\\:bg-c_blue:is(:active, [data-active]),.md\\:light\\:active\\:bg-c_blue:is(:active, [data-active]).light,.md\\:light\\:active\\:bg-c_blue:is(:active, [data-active])[data-theme=light] {
            background-color: blue;
      }
      }
      }"
    `)
  })

  test('pseudo conditions sorting', () => {
    const result = css(
      {
        _focus: {
          width: '2px',
        },
        _custom: {
          width: '3px',
        },
        _active: {
          width: '3px',
        },
        _hover: {
          width: '1px',
        },
      },
      {
        conditions: {
          custom: '&[data-attr="custom"]',
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "custom\\:w_3px",
        "focus\\:w_2px",
        "hover\\:w_1px",
        "active\\:w_3px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .custom\\:w_3px[data-attr="custom"] {
          width: 3px;
      }

        .focus\\:w_2px:is(:focus, [data-focus]) {
          width: 2px;
      }

        .hover\\:w_1px:is(:hover, [data-hover]) {
          width: 1px;
      }

        .active\\:w_3px:is(:active, [data-active]) {
          width: 3px;
      }
      }"
    `)
  })

  test('at-rules pseudo conditions sorting', () => {
    const result = css(
      {
        sm: {
          _focus: {
            width: '22px',
          },
          _custom: {
            width: '33px',
          },
          _active: {
            width: '44px',
          },
          _hover: {
            width: '11px',
          },
        },
      },
      {
        conditions: {
          custom: '&[data-attr="custom"]',
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "sm\\:custom\\:w_33px",
        "sm\\:focus\\:w_22px",
        "sm\\:hover\\:w_11px",
        "sm\\:active\\:w_44px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40rem) {
          .sm\\:custom\\:w_33px[data-attr="custom"] {
            width: 33px;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:focus\\:w_22px:is(:focus, [data-focus]) {
            width: 22px;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:hover\\:w_11px:is(:hover, [data-hover]) {
            width: 11px;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:active\\:w_44px:is(:active, [data-active]) {
            width: 44px;
      }
      }
      }"
    `)
  })

  test('nested conditions sorting', () => {
    const result = css(
      {
        md: {
          width: '3px',
        },
        _hover: {
          md: {
            width: '5px',
          },
          _focus: {
            width: '2px',
          },
          _custom: {
            color: 'blue',
          },
        },
      },
      {
        conditions: {
          custom: '&[data-attr="custom"]',
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "hover\\:custom\\:c_blue",
        "hover\\:focus\\:w_2px",
        "md\\:w_3px",
        "hover\\:md\\:w_5px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .hover\\:custom\\:c_blue:is(:hover, [data-hover])[data-attr="custom"] {
          color: blue;
      }

        .hover\\:focus\\:w_2px:is(:hover, [data-hover]):is(:focus, [data-focus]) {
          width: 2px;
      }

        @media screen and (min-width: 48rem) {
          .md\\:w_3px {
            width: 3px;
      }
      }

        @media screen and (min-width: 48rem) {
          .hover\\:md\\:w_5px:is(:hover, [data-hover]) {
            width: 5px;
      }
      }
      }"
    `)
  })

  test('nested mixed conditions sorting', () => {
    const result = css(
      {
        _hover: {
          md: {
            width: '5px',
          },
          _mixed: {
            color: 'green',
          },
          _mixedMd: {
            color: '6px',
          },
          _custom: {
            color: 'blue',
          },
        },
      },
      {
        conditions: {
          custom: '&[data-attr="custom"]',
          mixed: ['&[data-attr="custom"]'],
          mixedMd: ['@media screen and (min-width: 48em)', '&[data-attr="custom"]'],
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "hover\\:custom\\:c_blue",
        "hover\\:mixed\\:c_green",
        "hover\\:mixedMd\\:c_6px",
        "hover\\:md\\:w_5px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .hover\\:custom\\:c_blue:is(:hover, [data-hover])[data-attr="custom"] {
          color: blue;
      }

        .hover\\:mixed\\:c_green:is(:hover, [data-hover])[data-attr="custom"] {
          color: green;
      }

        @media screen and (min-width: 48em) {
          .hover\\:mixedMd\\:c_6px:is(:hover, [data-hover])[data-attr="custom"] {
            color: 6px;
      }
      }

        @media screen and (min-width: 48rem) {
          .hover\\:md\\:w_5px:is(:hover, [data-hover]) {
            width: 5px;
      }
      }
      }"
    `)
  })

  test('at-rules conditions sorting', () => {
    const result = css({
      md: {
        color: '3px',
      },
      sm: {
        width: '1px',
      },
      xl: {
        width: '4px',
      },
      lg: {
        color: '2px',
      },
    })

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "sm\\:w_1px",
        "md\\:c_3px",
        "lg\\:c_2px",
        "xl\\:w_4px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40rem) {
          .sm\\:w_1px {
            width: 1px;
      }
      }

        @media screen and (min-width: 48rem) {
          .md\\:c_3px {
            color: 3px;
      }
      }

        @media screen and (min-width: 64rem) {
          .lg\\:c_2px {
            color: 2px;
      }
      }

        @media screen and (min-width: 80rem) {
          .xl\\:w_4px {
            width: 4px;
      }
      }
      }"
    `)
  })

  test('at-rules + mixed conditions sorting', () => {
    const result = css(
      {
        md: {
          color: '3px',
        },
        _mixedSupportMd: {
          color: 'yellow',
        },
        sm: {
          width: '1px',
        },
        _mixedMd: {
          color: 'blue',
        },
        xl: {
          width: '4px',
        },
        _mixedSupportSm: {
          color: 'green',
        },
        lg: {
          color: '2px',
        },
        _mixedSm: {
          color: 'red',
        },
      },
      {
        conditions: {
          mixedSm: ['@media screen and (min-width: 40em)', '&[data-attr="custom"]'],
          mixedSupportSm: ['@media screen and (min-width: 40em)', '@support (display: flex)', '&[data-attr="custom"]'],
          mixedMd: ['@media screen and (min-width: 48em)', '&[data-attr="custom"]'],
          mixedSupportMd: ['@media screen and (min-width: 48em)', '@support (display: flex)', '&[data-attr="custom"]'],
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "mixedSm\\:c_red",
        "mixedSupportSm\\:c_green",
        "sm\\:w_1px",
        "mixedMd\\:c_blue",
        "mixedSupportMd\\:c_yellow",
        "md\\:c_3px",
        "lg\\:c_2px",
        "xl\\:w_4px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40em) {
          .mixedSm\\:c_red[data-attr="custom"] {
            color: red;
      }
      }

        @media screen and (min-width: 40em) {
          @support (display: flex) {
            .mixedSupportSm\\:c_green[data-attr="custom"] {
              color: green;
      }
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:w_1px {
            width: 1px;
      }
      }

        @media screen and (min-width: 48em) {
          .mixedMd\\:c_blue[data-attr="custom"] {
            color: blue;
      }
      }

        @media screen and (min-width: 48em) {
          @support (display: flex) {
            .mixedSupportMd\\:c_yellow[data-attr="custom"] {
              color: yellow;
      }
      }
      }

        @media screen and (min-width: 48rem) {
          .md\\:c_3px {
            color: 3px;
      }
      }

        @media screen and (min-width: 64rem) {
          .lg\\:c_2px {
            color: 2px;
      }
      }

        @media screen and (min-width: 80rem) {
          .xl\\:w_4px {
            width: 4px;
      }
      }
      }"
    `)
  })

  test('mixed vs at-rule sorting', () => {
    const result = css(
      {
        width: {
          _mdHover: '6px',
          md: '4.5px',
          _hover: {
            md: '5px',
          },
        },
      },
      {
        conditions: {
          mdHover: ['@media screen and (min-width: 48em)', '@supports (display: flex)', '&:hover'],
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "mdHover\\:w_6px",
        "md\\:w_4\\.5px",
        "hover\\:md\\:w_5px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 48em) {
          @supports (display: flex) {
            .mdHover\\:w_6px:hover {
              width: 6px;
      }
      }
      }

        @media screen and (min-width: 48rem) {
          .md\\:w_4\\.5px {
            width: 4.5px;
      }
      }

        @media screen and (min-width: 48rem) {
          .hover\\:md\\:w_5px:is(:hover, [data-hover]) {
            width: 5px;
      }
      }
      }"
    `)
  })

  test('mixed conditions sorting', () => {
    const result = css(
      {
        width: {
          _supportHover: '6px',
          base: '0px',
          _mdHover: '8px',
          sm: '4px',
          md: '4.5px',
          _smHover: '7px',
          _hover: {
            base: '2px',
            md: '5px',
            _focus: '3px',
          },
          _dark: '1px',
        },
        _suppportHover: {
          _custom: {
            color: 'red',
          },
        },
        _hover: {
          _custom: {
            color: 'blue',
          },
        },
      },
      {
        conditions: {
          custom: ['&[data-attr="custom"]'],
          supportHover: ['@media (hover: hover) and (pointer: fine)', '@supports (display: table-cell)', '&:hover'],
          smHover: ['@media screen and (min-width: 40em)', '@supports (display: grid)', '&:hover'],
          mdHover: ['@media screen and (min-width: 48em)', '@supports (display: flex)', '&:hover'],
        },
      },
    )

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "w_0px",
        "dark\\:w_1px",
        "hover\\:w_2px",
        "hover\\:focus\\:w_3px",
        "custom\\:c_red",
        "hover\\:custom\\:c_blue",
        "smHover\\:w_7px",
        "sm\\:w_4px",
        "mdHover\\:w_8px",
        "md\\:w_4\\.5px",
        "hover\\:md\\:w_5px",
        "supportHover\\:w_6px",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .w_0px {
          width: 0px;
      }

        [data-theme=dark] .dark\\:w_1px,.dark .dark\\:w_1px,.dark\\:w_1px.dark,.dark\\:w_1px[data-theme=dark] {
          width: 1px;
      }

        .hover\\:w_2px:is(:hover, [data-hover]) {
          width: 2px;
      }

        .hover\\:focus\\:w_3px:is(:hover, [data-hover]):is(:focus, [data-focus]) {
          width: 3px;
      }

        .custom\\:c_red[data-attr="custom"] {
          color: red;
      }

        .hover\\:custom\\:c_blue:is(:hover, [data-hover])[data-attr="custom"] {
          color: blue;
      }

        @media screen and (min-width: 40em) {
          @supports (display: grid) {
            .smHover\\:w_7px:hover {
              width: 7px;
      }
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:w_4px {
            width: 4px;
      }
      }

        @media screen and (min-width: 48em) {
          @supports (display: flex) {
            .mdHover\\:w_8px:hover {
              width: 8px;
      }
      }
      }

        @media screen and (min-width: 48rem) {
          .md\\:w_4\\.5px {
            width: 4.5px;
      }
      }

        @media screen and (min-width: 48rem) {
          .hover\\:md\\:w_5px:is(:hover, [data-hover]) {
            width: 5px;
      }
      }

        @media (hover: hover) and (pointer: fine) {
          @supports (display: table-cell) {
            .supportHover\\:w_6px:hover {
              width: 6px;
      }
      }
      }
      }"
    `)
  })
})
