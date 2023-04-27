import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { Stylesheet } from '../src'
import { createContext } from './fixture'

function globalCss(values: Dict) {
  const ctx = createContext()
  const sheet = new Stylesheet(ctx)
  sheet.processGlobalCss(values)
  return sheet.toCss({ optimize: true })
}

describe('Global css', () => {
  test('with direct nesting + conditional value', () => {
    const sheet = globalCss({
      '.btn': {
        width: { base: '40px', lg: '90px' },
        '&:hover': {
          divideX: '40px',
          '& > span': {
            color: 'pink',
          },
        },
        _focus: {
          color: 'red.200',
          _hover: {
            backgroundColor: 'red.400',
          },
        },
        sm: {
          fontSize: '12px',
        },
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer base {
        .btn {
          width: 40px;
          }

        .btn:focus {
          color: var(--colors-red-200);
          }

        .btn:focus:hover {
          background-color: var(--colors-red-400);
          }

        .btn:hover > * ~ * {
          border-left-width: 40px;
          border-right-width: 0px;
          }

        .btn:hover > span {
          color: pink;
          }

        @media screen and (min-width: 30em) {
          .btn {
            font-size: 12px;
              }
          }

        @media screen and (min-width: 62em) {
          .btn {
            width: 90px;
              }
          }
      }"
    `)
  })

  test('classic style object', () => {
    const sheet = globalCss({
      html: {
        scrollPaddingTop: '80px',
        '&.dragging-ew': {
          userSelect: 'none !important',
          '& *': {
            cursor: 'ew-resize !important',
          },
          _hover: {
            color: 'red',
          },
        },
      },
      '.content-dark::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--colors-bg, #000) !important',
        borderColor: 'var(--colors-fg, #333) !important',
        borderRadius: '9px',
        border: '2px solid',
      },
      '#corner': {
        position: 'fixed',
        right: 0,
        bottom: 0,
        cursor: 'nwse-resize',
      },
      '.color-picker .react-colorful': {
        width: '100%',
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer base {
        html {
          scroll-padding-top: 80px;
          }

        html.dragging-ew {
          user-select: none !important;
          }

        html.dragging-ew * {
          cursor: ew-resize !important;
          }

        .content-dark::-webkit-scrollbar-thumb {
          background-color: var(--colors-bg, #000) !important;
          border-color: var(--colors-fg, #333) !important;
          border-radius: 9px;
          border: 2px solid;
          }

        #corner {
          position: fixed;
          right: 0;
          bottom: 0;
          cursor: nwse-resize;
          }

        .color-picker .react-colorful {
          width: 100%;
          }

        html.dragging-ew:hover {
          color: red;
          }
      }"
    `)
  })

  test('autoprefixed', () => {
    const sheet = globalCss({
      'x-element': {
        tabSize: 'none',
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer base {
        x-element {
          tab-size: none
          }
      }"
    `)
  })

  test('nesting rules', () => {
    const sheet = globalCss({
      'body > a': {
        '&:not(:hover)': {
          textDecoration: 'none',
        },
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer base {
        body > a:not(:hover) {
          text-decoration: none
          }
      }"
    `)
  })

  test('with recursive nesting rule', () => {
    const sheet = globalCss({
      p: {
        margin: 0,
        '& ~ &': {
          marginTop: 0,
        },
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer base {
        p {
          margin: 0;
          }

        p ~ p {
          margin-top: 0;
          }
      }"
    `)
  })

  test('with complex recursive nesting rule + numeric value', () => {
    const sheet = globalCss({
      'body > p, body > ul': {
        margin: 0,
        '& ~ &': {
          marginTop: 10,
        },
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer base {
        body > p, body > ul {
          margin: 0;
          }

        body > p ~ body > p, body > ul ~ body > ul {
          margin-top: 10px;
          }
      }"
    `)
  })
})
