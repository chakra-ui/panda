import { createGeneratorContext } from '@pandacss/fixture'
import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import expandTokenFn from '../src/plugins/expand-token-fn'

const ctx = createGeneratorContext()

function run(code: string) {
  return postcss([expandTokenFn(ctx.utility.getToken, ctx.utility.tokens.getByName)]).process(code, {
    from: undefined,
  })
}

const css = (v: TemplateStringsArray) => v[0]

describe('expandTokenFn', () => {
  test('existing', () => {
    const result = run(css`
      * {
        color: token(colors.red.400);
        border: 1px solid token(colors.blue.400);
        background-image: linear-gradient(token(colors.red.400), token(colors.blue.400));
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var(--colors-red-400);
              border: 1px solid var(--colors-blue-400);
              background-image: linear-gradient(var(--colors-red-400), var(--colors-blue-400));
            }
          "
    `)
  })

  test('with fallback', () => {
    const result = run(css`
      * {
        color: token(colors.red.400, colors.blue.400);
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var(--colors-red-400, var(--colors-blue-400));
            }
          "
    `)
  })

  test('non-existing should be wrapped in quotes to avoid CSS Syntax error', () => {
    const result = run(css`
      * {
        color: token(colors.doesntexist.400, pink);
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var(colors\\\\.doesntexist\\\\.400, pink);
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
        @container (min-width: token(sizes.12345)) {
          .\[\@container_\(min-width\:_token\(sizes\.12345\)\)\]\:text_green {
            color: green;
          }
        }
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            @layer utilities {
              @container (min-width: 56rem) {
                .[@container_(min-width:_56rem)]:text_green {
                  color: green;
                }
              }
              @container (min-width: sizes\\\\.12345) {
                .[@container_(min-width:_sizes\\\\.12345)]:text_green {
                  color: green;
                }
              }
            }
          "
    `)
  })
})
