import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'

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
  variants: {
    size: {
      sm: {
        fontSize: '1',
        sm: {
          fontSize: '3',
        },
        _hover: {
          fontSize: '2',
        },
      },
      md: {
        sm: {
          fontSize: '3.3',
        },
        _focus: {
          fontSize: '2.2',
        },
        fontSize: '2.1',
      },
    },
  },
}

describe('sort style rules', () => {
  test('css', () => {
    const ctx = createContext()

    ctx.encoder.processAtomic({
      fontSize: '1',
      _focus: {
        fontSize: '3',
      },
      sm: {
        fontSize: '5',
        backgroundColor: {
          base: 'red',
          _hover: 'green',
        },
      },
      "&[data-attr='test']": {
        fontSize: '2',
        _expanded: {
          fontSize: '4',
        },
      },
    })

    ctx.decoder.collect(ctx.encoder)
    const sheet = ctx.createSheet()
    sheet.processDecoder(ctx.decoder)

    expect(sheet.toCss()).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_1 {
          font-size: 1px;
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:fs_2[data-attr='test'] {
          font-size: 2px;
      }

        .focus\\:fs_3:is(:focus, [data-focus]) {
          font-size: 3px;
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:fs_4[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
          font-size: 4px;
      }

        @media screen and (min-width: 40rem) {
          .sm\\:fs_5 {
            font-size: 5px;
      }
          .sm\\:bg-c_red {
            background-color: red;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:hover\\:bg-c_green:is(:hover, [data-hover]) {
            background-color: green;
      }
      }
      }"
    `)

    ctx.encoder.processAtomic({
      fontSize: '1.1',
      sm: {
        fontSize: '5.3',
        backgroundColor: {
          base: 'blue',
          _hover: 'purple',
        },
      },
      _hover: {
        fontSize: '3.2',
      },
    })
    ctx.decoder.collect(ctx.encoder)

    const sheet2 = ctx.createSheet()
    sheet2.processDecoder(ctx.decoder)

    expect(sheet2.toCss()).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_1 {
          font-size: 1px;
      }

        .fs_1\\.1 {
          font-size: 1.1px;
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:fs_2[data-attr='test'] {
          font-size: 2px;
      }

        .focus\\:fs_3:is(:focus, [data-focus]) {
          font-size: 3px;
      }

        .hover\\:fs_3\\.2:is(:hover, [data-hover]) {
          font-size: 3.2px;
      }

        .\\[\\&\\[data-attr\\=\\'test\\'\\]\\]\\:expanded\\:fs_4[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) {
          font-size: 4px;
      }

        @media screen and (min-width: 40rem) {
          .sm\\:fs_5 {
            font-size: 5px;
      }
          .sm\\:bg-c_red {
            background-color: red;
      }
          .sm\\:fs_5\\.3 {
            font-size: 5.3px;
      }
          .sm\\:bg-c_blue {
            background-color: blue;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:hover\\:bg-c_green:is(:hover, [data-hover]) {
            background-color: green;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:hover\\:bg-c_purple:is(:hover, [data-hover]) {
            background-color: purple;
      }
      }
      }"
    `)
  })

  test('recipe', () => {
    const ctx = createContext({ theme: { extend: { recipes: { button: buttonRecipe } } } })

    ctx.encoder.processRecipe('button', { size: 'sm' })
    ctx.decoder.collect(ctx.encoder)
    const sheet = ctx.createSheet()
    sheet.processDecoder(ctx.decoder)

    expect(sheet.toCss()).toMatchInlineSnapshot(`
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

        .btn--size_sm {
          font-size: 1px;
      }

        .btn--size_sm:is(:hover, [data-hover]) {
          font-size: 2px;
      }

        @media screen and (min-width: 40rem) {
          .btn--size_sm {
            font-size: 3px;
      }
      }
      }"
    `)

    ctx.encoder.processRecipe('button', { size: 'md' })
    ctx.decoder.collect(ctx.encoder)

    const sheet2 = ctx.createSheet()
    sheet2.processDecoder(ctx.decoder)

    expect(sheet2.toCss()).toMatchInlineSnapshot(`
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

        .btn--size_sm {
          font-size: 1px;
      }

        .btn--size_sm:is(:hover, [data-hover]) {
          font-size: 2px;
      }

        .btn--size_md {
          font-size: 2.1px;
      }

        .btn--size_md:is(:focus, [data-focus]) {
          font-size: 2.2px;
      }

        @media screen and (min-width: 40rem) {
          .btn--size_sm {
            font-size: 3px;
      }
          .btn--size_md {
            font-size: 3.3px;
      }
      }
      }"
    `)
  })
})
