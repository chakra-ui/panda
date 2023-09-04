import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import expandTokenFn from '../src/plugins/expand-token-fn'

const tokens: Record<string, string> = {
  'colors.red': 'var(--colors-red)',
  'colors.blue': 'var(--colors-blue)',
  'sizes.4xl': '56rem',
}

function run(code: string) {
  return postcss([expandTokenFn((token) => tokens[token])]).process(code, {
    from: undefined,
  })
}

const css = (v: TemplateStringsArray) => v[0]

describe('expandTokenFn', () => {
  test('existing', () => {
    const result = run(css`
      * {
        color: token(colors.red);
        border: 1px solid token(colors.blue);
        background-image: linear-gradient(token(colors.red), token(colors.blue));
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var(--colors-red);
              border: 1px solid var(--colors-blue);
              background-image: linear-gradient(var(--colors-red), var(--colors-blue));
            }
          "
    `)
  })

  test('with fallback', () => {
    const result = run(css`
      * {
        color: token(colors.red, colors.blue);
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var(--colors-red, var(--colors-blue));
            }
          "
    `)
  })

  test('non-existing should be wrapped in quotes to avoid CSS Syntax error', () => {
    const result = run(css`
      * {
        color: token(colors.magenta, pink);
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var('colors.magenta', pink);
            }
          "
    `)
  })

  test('non-existing should remain unchanged', () => {
    const result = run(css`
      @layer utilities {
        @container (min-width: token(sizes.4xl, 1280px)) {
          .\[\@container_\(min-width\:_token\(sizes\.4xl\)\)\]\:text_green {
            color: green;
          }
        }
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            @layer utilities {
              @container (min-width: 56rem) {
                .[@container_(min-width:_token(sizes.4xl))]:text_green {
                  color: green;
                }
              }
            }
          "
    `)
  })
})
