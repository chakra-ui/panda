import { createGeneratorContext } from '@pandacss/fixture'
import type { Dict, RecipeDefinition, SlotRecipeDefinition } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { RuleProcessor } from '../src/rule-processor'
import { createRuleProcessor } from './fixture'

const css = (styles: Dict) => {
  const result = createRuleProcessor().css(styles)
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
        "text_blue\\.300",
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

        .text_blue\\.300 {
          color: var(--colors-blue-300);
      }
      }"
    `)
  })

  test('simple with formatTokenName', () => {
    const css = (styles: any) => {
      const result = createRuleProcessor({
        hooks: {
          'tokens:created': (ctx) => {
            ctx.tokens.formatTokenName = (path: string[]) => '$' + path.join('-')
          },
        },
      }).css(styles)
      return { className: result.getClassNames(), css: result.toCss() }
    }

    const result = css({
      margin: '$2',
      p: '{spacing.$2}',
      mx: 'token(spacing.$2)',
      my: '-$2',
      color: '$blue-300',
    })
    expect(result.className).toMatchInlineSnapshot(`
      [
        "m_\\$2",
        "p_\\{spacing\\.\\$2\\}",
        "mx_token\\(spacing\\.\\$2\\)",
        "my_-\\$2",
        "text_\\$blue-300",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_\\$2 {
          margin: var(--spacing-2);
      }

        .p_\\{spacing\\.\\$2\\} {
          padding: var(--spacing-2);
      }

        .mx_token\\(spacing\\.\\$2\\) {
          margin-inline: var(--spacing-2);
      }

        .my_-\\$2 {
          margin-block: calc(var(--spacing-2) * -1);
      }

        .text_\\$blue-300 {
          color: var(--colors-blue-300);
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
    console.timeEnd('css')

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "text_red",
        "border_1px_solid_token\\(colors\\.red\\.100\\)",
        "bg_blue\\.300",
        "textStyle_headline\\.h1",
        "w_1",
        "fs_xs",
        "dark\\:fs_2xl",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:text_green",
        "hover\\:fs_md",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:text_purple",
        "hover\\:focus\\:fs_xl",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:text_cyan",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:open\\:text_orange",
        "sm\\:w_2",
        "sm\\:fs_sm",
        "sm\\:text_yellow",
        "sm\\:bg_red",
        "xl\\:w_3",
        "sm\\:hover\\:bg_green",
        "hover\\:md\\:fs_lg",
        "\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:xl\\:text_pink",
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

        .text_red\\! {
          color: red !important;
      }

        .border_1px_solid_token\\(colors\\.red\\.100\\) {
          border: 1px solid var(--colors-red-100);
      }

        .bg_blue\\.300 {
          background: var(--colors-blue-300);
      }

        .w_1 {
          width: var(--sizes-1);
      }

        .fs_xs {
          font-size: var(--font-sizes-xs);
      }

        [data-theme=dark] .dark\\:fs_2xl,.dark .dark\\:fs_2xl,.dark\\:fs_2xl.dark,.dark\\:fs_2xl[data-theme=dark] {
          font-size: var(--font-sizes-2xl);
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:text_green[data-attr='test'] {
          color: green;
      }

        .hover\\:fs_md:is(:hover, [data-hover]) {
          font-size: var(--font-sizes-md);
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:text_purple[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
          color: purple;
      }

        .hover\\:focus\\:fs_xl:is(:hover, [data-hover]):is(:focus, [data-focus]) {
          font-size: var(--font-sizes-xl);
      }

        .target .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:text_cyan[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
          color: cyan;
      }

        .target .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:open\\:text_orange[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):is([open], [data-open], [data-state="open"]) {
          color: orange;
      }

        @media screen and (min-width: 40em) {
          .sm\\:w_2 {
            width: var(--sizes-2);
      }
          .sm\\:fs_sm {
            font-size: var(--font-sizes-sm);
      }
          .sm\\:text_yellow {
            color: yellow;
      }
          .sm\\:bg_red {
            background-color: red;
      }
      }

        @media screen and (min-width: 40em) {
          .sm\\:hover\\:bg_green:is(:hover, [data-hover]) {
            background-color: green;
      }
      }

        @media screen and (min-width: 48em) {
          .hover\\:md\\:fs_lg:is(:hover, [data-hover]) {
            font-size: var(--font-sizes-lg);
      }
      }

        @media screen and (min-width: 80em) {
          .xl\\:w_3 {
            width: var(--sizes-3);
      }
      }

        @media screen and (min-width: 80em) {
          .target .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:\\[\\.target_\\&\\]\\:xl\\:text_pink[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
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
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem;
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

        @media screen and (min-width: 48em) {
          .md\\:buttonStyle--size_md {
            height: 3rem;
            min-width: 3rem;
            padding: 0 0.75rem;
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
        "d_inline-flex",
        "items_center",
        "justify_center",
        "textStyle_headline\\.h1",
        "h_2\\.5rem",
        "min-w_2\\.5rem",
        "p_0_0\\.5rem",
        "h_3rem",
        "min-w_3rem",
        "p_0_0\\.75rem",
        "bg_blue",
        "text_white",
        "bg_transparent",
        "border_1px_solid_blue",
        "text_blue",
        "\\[\\&\\[data-disabled\\]\\]\\:bg_gray",
        "\\[\\&\\[data-disabled\\]\\]\\:text_black",
        "\\[\\&\\[data-disabled\\]\\]\\:bg_transparent",
        "\\[\\&\\[data-disabled\\]\\]\\:border_1px_solid_gray",
        "\\[\\&\\[data-disabled\\]\\]\\:text_gray",
        "hover\\:bg_darkblue",
        "hover\\:bg_blue",
        "hover\\:text_white",
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

        .d_inline-flex {
          display: inline-flex;
      }

        .items_center {
          align-items: center;
      }

        .justify_center {
          justify-content: center;
      }

        .h_2\\.5rem {
          height: 2.5rem;
      }

        .min-w_2\\.5rem {
          min-width: 2.5rem;
      }

        .p_0_0\\.5rem {
          padding: 0 0.5rem;
      }

        .h_3rem {
          height: 3rem;
      }

        .min-w_3rem {
          min-width: 3rem;
      }

        .p_0_0\\.75rem {
          padding: 0 0.75rem;
      }

        .bg_blue {
          background-color: blue;
      }

        .text_white {
          color: var(--colors-white);
      }

        .bg_transparent {
          background-color: var(--colors-transparent);
      }

        .border_1px_solid_blue {
          border: 1px solid blue;
      }

        .text_blue {
          color: blue;
      }

        .\\[\\&\\[data-disabled\\]\\]\\:bg_gray[data-disabled] {
          background-color: gray;
      }

        .\\[\\&\\[data-disabled\\]\\]\\:text_black[data-disabled] {
          color: var(--colors-black);
      }

        .\\[\\&\\[data-disabled\\]\\]\\:bg_transparent[data-disabled] {
          background-color: var(--colors-transparent);
      }

        .\\[\\&\\[data-disabled\\]\\]\\:border_1px_solid_gray[data-disabled] {
          border: 1px solid gray;
      }

        .\\[\\&\\[data-disabled\\]\\]\\:text_gray[data-disabled] {
          color: gray;
      }

        .hover\\:bg_darkblue:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .hover\\:bg_blue:is(:hover, [data-hover]) {
          background-color: blue;
      }

        .hover\\:text_white:is(:hover, [data-hover]) {
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
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
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

        @media screen and (min-width: 48em) {
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
        "d_flex",
        "items_center",
        "gap_2",
        "border-w_1px",
        "rounded_sm",
        "w_8",
        "h_8",
        "w_10",
        "h_10",
        "w_12",
        "h_12",
        "ms_2",
        "fs_sm",
        "fs_md",
        "fs_lg",
      ]
    `)
    expect(checkbox.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex;
      }

        .items_center {
          align-items: center;
      }

        .gap_2 {
          gap: var(--spacing-2);
      }

        .border-w_1px {
          border-width: 1px;
      }

        .rounded_sm {
          border-radius: var(--radii-sm);
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
            line-height: 1.2;
            display: inline-flex;
            outline: var(--borders-none);
      }

          .btn:is(:disabled, [disabled], [data-disabled]) {
            opacity: 0.4;
      }

          .btn:is(:focus-visible, [data-focus-visible]) {
            box-shadow: outline;
      }

          .btn:is(:focus, [data-focus]) {
            z-index: 1;
      }

          .btn:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled]) {
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
            line-height: 1.2;
            display: inline-flex;
            outline: var(--borders-none);
      }

          .btn:is(:disabled, [disabled], [data-disabled]) {
            opacity: 0.4;
      }

          .btn:is(:focus-visible, [data-focus-visible]) {
            box-shadow: outline;
      }

          .btn:is(:focus, [data-focus]) {
            z-index: 1;
      }

          .btn:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled]) {
            background: initial;
      }
      }
      }

      @layer utilities {
        .text_blue\\.300 {
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

        .border_2px_solid_token\\(colors\\.green\\.100\\) {
          border: 2px solid var(--colors-green-100);
      }

        .hover\\:text_red\\.400:is(:hover, [data-hover]) {
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
        .text_red {
          color: red;
      }

        .text_blue {
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
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
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
        .d_none {
          display: none;
      }

        .h_100\\% {
          height: 100%;
      }

        .transition_all_\\.3s_ease-in-out {
          transition: all .3s ease-in-out;
      }

        .opacity_0\\! {
          opacity: 0 !important;
      }

        .opacity_1 {
          opacity: 1;
      }

        .h_10px {
          height: 10px;
      }

        .bg-gradient_to-b {
          --gradient-stops: var(--gradient-from), var(--gradient-to);
          --gradient: var(--gradient-via-stops, var(--gradient-stops));
          background-image: linear-gradient(to bottom, var(--gradient));
      }

        .from_rgb\\(200_200_200_\\/_\\.4\\) {
          --gradient-from: rgb(200 200 200 / .4);
      }
      }"
    `)
  })

  test('css - boolean utility', () => {
    const result = css({ truncate: false })
    expect(result).toMatchInlineSnapshot(`
      {
        "className": [
          "truncate_false",
        ],
        "css": "",
      }
    `)

    const result2 = css({ truncate: true })
    expect(result2).toMatchInlineSnapshot(`
      {
        "className": [
          "truncate_true",
        ],
        "css": "@layer utilities {
        .truncate_true {
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
          "text_\\#fff",
          "d_block",
          "d_none",
        ],
        "css": "@layer utilities {
        .text_\\#fff {
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

        .w_42 {
          width: 42px;
      }

        .opacity_1 {
          opacity: 1;
      }

        .z_0 {
          z-index: 0;
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
        .border_red\\! {
          border-color: red !important;
      }

        .text_pink\\! {
          color: pink !important;
      }

        .bg_white\\! {
          background: var(--colors-white) !important;
      }

        .font_A {
          font-family: A;
      }
      }"
    `)
  })
})
