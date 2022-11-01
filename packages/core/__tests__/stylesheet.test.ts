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
      "@layer base {
          type: object;
          data a {
              width: 50%;
          }
          data a:hover > * ~ * {
              border-left-width: 40px;
              border-right-width: 0px;
          }
          data a:focus {
              color: var(--colors-red-200);
          }
          data a:focus:hover {
              background-color: var(--colors-red-400);
          }
          @media screen and (min-width: 30em) {
              data a {
                  font-size: 12px;
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
      "@layer base {
          type: object;
          data html {
              scroll-padding-top: 80px;
          }
          data html.dragging-ew {
              user-select: none !important;
          }
          data html.dragging-ew * {
              cursor: ew-resize !important;
          }
          data html.dragging-ew:hover {
              color: red;
          }
          data .content-dark::-webkit-scrollbar-thumb {
              background-color: var(--colors-bg, #000) !important;
              border-color: var(--colors-fg, #333) !important;
              border-radius: 9px;
              border: 2px solid;
          }
          data #corner {
              position: fixed;
              right: 0;
              bottom: 0;
              cursor: nwse-resize;
          }
          data .color-picker .react-colorful {
              width: 100%;
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
          type: object;
          data x-element {
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
          type: object;
          data body > a:not(:hover) {
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
          type: object;
          data p {
              margin: 0;
          }
          data p ~ data p {
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
          type: object;
          data body > p, data body > ul {
              margin: 0;
          }
          data body > p ~ data body > p, data body > ul ~ data body > ul {
              margin-top: 10px;
          }
      }"
    `)
  })
})
