import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { Dict } from '@pandacss/types'

const css = (styles: Dict) => {
  const result = createRuleProcessor().css(styles)
  return { className: result.className, css: result.toCss() }
}

const recipe = (name: string, styles: Dict) => {
  const result = createRuleProcessor().recipe(name, styles)!
  return { className: result.className, css: result.toCss() }
}

const cva = (styles: Dict) => {
  const result = createRuleProcessor().cva(styles)!
  return { className: result.className, css: result.toCss() }
}

describe('rule processor', () => {
  test('css', () => {
    const result = css({
      color: 'red !important',
      border: '1px solid token(red.100)',
      bg: 'blue.300',
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
              _opened: 'orange',
              _xl: 'pink',
            },
          },
        },
      },
    })

    expect(result.className).toMatchInlineSnapshot(
      `
      [
        "text_red",
        "border_1px_solid_token\\\\(red\\\\.100\\\\)",
        "bg_blue\\\\.300",
        "w_1",
        "fs_xs",
        "dark\\\\:fs_2xl",
        "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:text_green",
        "hover\\\\:fs_md",
        "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:text_purple",
        "hover\\\\:focus\\\\:fs_xl",
        "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:text_cyan",
        "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:_opened_orange",
        "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:_xl_pink",
        "sm\\\\:w_2",
        "sm\\\\:fs_sm",
        "sm\\\\:text_yellow",
        "sm\\\\:bg_red",
        "xl\\\\:w_3",
        "sm\\\\:hover\\\\:bg_green",
        "hover\\\\:md\\\\:fs_lg",
      ]
    `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_red {
          color: red
      }

        .border_1px_solid_token\\\\(red\\\\.100\\\\) {
          border: 1px solid red\\\\.100
      }

        .bg_blue\\\\.300 {
          background: var(--colors-blue-300)
      }

        .w_1 {
          width: var(--sizes-1)
      }

        .fs_xs {
          font-size: var(--font-sizes-xs)
      }

        [data-theme=dark] .dark\\\\:fs_2xl, .dark .dark\\\\:fs_2xl, .dark\\\\:fs_2xl.dark, .dark\\\\:fs_2xl[data-theme=dark] {
          font-size: var(--font-sizes-2xl)
      }

        .\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:text_green[data-attr='test'] {
          color: green
      }

        .\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:text_purple[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"]) {
          color: purple
      }

        .target .\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:text_cyan[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"]) {
          color: cyan
      }

        .target .\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:_opened_orange[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"]) {
          opened: orange
      }

        .target .\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:_xl_pink[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"]) {
          xl: pink
      }

        .hover\\\\:focus\\\\:fs_xl:is(:hover, [data-hover]):is(:focus, [data-focus]) {
          font-size: var(--font-sizes-xl)
      }

        .hover\\\\:fs_md:is(:hover, [data-hover]) {
          font-size: var(--font-sizes-md)
      }

        @media screen and (min-width: 40em) {
          .sm\\\\:w_2 {
            width: var(--sizes-2)
          }

          .sm\\\\:fs_sm {
            font-size: var(--font-sizes-sm)
          }

          .sm\\\\:text_yellow {
            color: yellow
          }

          .sm\\\\:bg_red {
            background-color: red
          }
      }

        @media screen and (min-width: 40em) {
          .sm\\\\:hover\\\\:bg_green:is(:hover, [data-hover]) {
            background-color: green
          }
      }

        @media screen and (min-width: 48em) {
          .hover\\\\:md\\\\:fs_lg:is(:hover, [data-hover]) {
            font-size: var(--font-sizes-lg)
          }
      }

        @media screen and (min-width: 80em) {
          .xl\\\\:w_3 {
            width: var(--sizes-3)
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
        "md\\\\:buttonStyle--size_md",
        "buttonStyle--variant_solid",
        "buttonStyle",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black);
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
        "h_2\\\\.5rem",
        "min-w_2\\\\.5rem",
        "p_0_0\\\\.5rem",
        "h_3rem",
        "min-w_3rem",
        "p_0_0\\\\.75rem",
        "bg_blue",
        "text_white",
        "bg_transparent",
        "border_1px_solid_blue",
        "text_blue",
        "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_gray",
        "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_black",
        "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_transparent",
        "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:border_1px_solid_gray",
        "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_gray",
        "hover\\\\:bg_darkblue",
        "hover\\\\:bg_blue",
        "hover\\\\:text_white",
      ]
    `)
    expect(buttonStyle.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_inline-flex {
          display: inline-flex
      }

        .items_center {
          align-items: center
      }

        .justify_center {
          justify-content: center
      }

        .h_2\\\\.5rem {
          height: 2.5rem
      }

        .min-w_2\\\\.5rem {
          min-width: 2.5rem
      }

        .p_0_0\\\\.5rem {
          padding: 0 0.5rem
      }

        .h_3rem {
          height: 3rem
      }

        .min-w_3rem {
          min-width: 3rem
      }

        .p_0_0\\\\.75rem {
          padding: 0 0.75rem
      }

        .bg_blue {
          background-color: blue
      }

        .text_white {
          color: var(--colors-white)
      }

        .bg_transparent {
          background-color: var(--colors-transparent)
      }

        .border_1px_solid_blue {
          border: 1px solid blue
      }

        .text_blue {
          color: blue
      }

        .\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_gray[data-disabled] {
          background-color: gray
      }

        .\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_black[data-disabled] {
          color: var(--colors-black)
      }

        .\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_transparent[data-disabled] {
          background-color: var(--colors-transparent)
      }

        .\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:border_1px_solid_gray[data-disabled] {
          border: 1px solid gray
      }

        .\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_gray[data-disabled] {
          color: gray
      }

        .hover\\\\:bg_darkblue:is(:hover, [data-hover]) {
          background-color: darkblue
      }

        .hover\\\\:bg_blue:is(:hover, [data-hover]) {
          background-color: blue
      }

        .hover\\\\:text_white:is(:hover, [data-hover]) {
          color: var(--colors-white)
      }
      }"
    `)
  })

  test('slot recipe', () => {
    const result = recipe('checkbox', { size: { base: 'sm', md: 'md' } })

    expect(result.className).toMatchInlineSnapshot(`
      [
        "checkbox__root--size_sm",
        "md\\\\:checkbox__root--size_md",
        "checkbox__control--size_sm",
        "md\\\\:checkbox__control--size_md",
        "checkbox__label--size_sm",
        "md\\\\:checkbox__label--size_md",
        "checkbox__root",
        "checkbox__control",
        "checkbox__label",
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        .checkbox__control--size_sm {
          width: var(--sizes-8);
          height: var(--sizes-8)
      }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm)
      }

        @layer _base {
          .checkbox__root {
            display: flex;
            align-items: center;
            gap: var(--spacing-2)
      }

          .checkbox__control {
            border-width: 1px;
            border-radius: var(--radii-sm)
      }

          .checkbox__label {
            margin-inline-start: var(--spacing-2)
      }
      }

        @media screen and (min-width: 48em) {
          .md\\\\:checkbox__control--size_md {
            width: var(--sizes-10);
            height: var(--sizes-10)
          }

          .md\\\\:checkbox__label--size_md {
            font-size: var(--font-sizes-md)
          }
      }
      }"
    `)
  })

  test('sva', () => {
    // packages/fixture/src/slot-recipes.ts
    const checkbox = cva({
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
        "border-width_1px",
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
          display: flex
      }

        .items_center {
          align-items: center
      }

        .gap_2 {
          gap: var(--spacing-2)
      }

        .border-width_1px {
          border-width: 1px
      }

        .rounded_sm {
          border-radius: var(--radii-sm)
      }

        .w_8 {
          width: var(--sizes-8)
      }

        .h_8 {
          height: var(--sizes-8)
      }

        .w_10 {
          width: var(--sizes-10)
      }

        .h_10 {
          height: var(--sizes-10)
      }

        .w_12 {
          width: var(--sizes-12)
      }

        .h_12 {
          height: var(--sizes-12)
      }

        .ms_2 {
          margin-inline-start: var(--spacing-2)
      }

        .fs_sm {
          font-size: var(--font-sizes-sm)
      }

        .fs_md {
          font-size: var(--font-sizes-md)
      }

        .fs_lg {
          font-size: var(--font-sizes-lg)
      }
      }"
    `)
  })
})
