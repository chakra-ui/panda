import type { Dict } from '@css-panda/types'
import { describe, expect, test } from 'vitest'
import { Stylesheet } from '../src'
import { createContext } from './fixture'

function globalCss(values: Dict) {
  const ctx = createContext()
  const sheet = new Stylesheet(ctx)

  sheet.processGlobalCss({
    type: 'object',
    data: values,
  })

  return sheet.toCss()
}

describe('Global styles', () => {
  test('with nested + conditions', () => {
    const sheet = globalCss({
      a: {
        width: '1/2',
        '&:hover': {
          divideX: '40px',
        },
        focus: {
          color: 'red.200',
          hover: {
            backgroundColor: 'red.400',
          },
        },
        sm: {
          fontSize: '12px',
        },
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "a {
        width: 50%;
      }

      a:hover > * ~ * {
        border-left-width: 40px;
        border-right-width: 0px;
      }

      a:focus {
        color: var(--colors-red\\\\.200);
      }

      a:focus:hover {
        background-color: var(--colors-red\\\\.400);
      }

      @media screen and (min-width: 30em) {
        a {
          font-size: 12px;
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
          '*': {
            cursor: 'ew-resize !important',
          },
          hover: {
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
      "html {
        scroll-padding-top: 80px;
      }

      html.dragging-ew {
        -webkit-user-select: none !important;
           -moz-user-select: none !important;
                user-select: none !important;
      }

      html.dragging-ew * {
        cursor: ew-resize !important;
      }

      html.dragging-ew:hover {
        color: red;
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
      "x-element {
        -moz-tab-size: none;
          -o-tab-size: none;
             tab-size: none;
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
      "body > a:not(:hover) {
        text-decoration: none;
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
      "p {
        margin: 0;
      }

      p ~ p {
        margin-top: 0;
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
      "body > p,
      body > ul {
        margin: 0;
      }

      body > p ~ body > p,
      body > ul ~ body > ul {
        margin-top: 10px;
      }"
    `)
  })
})
