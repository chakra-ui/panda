import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import expandTokenFn from '../src/plugins/expand-token-fn'

const tokens: Record<string, string> = {
  'colors.red': 'var(--colors-red)',
  'colors.blue': 'var(--colors-blue)',
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

  test('non-existing should remain unchanged', () => {
    const result = run(css`
      * {
        color: token(colors.magenta, pink);
      }
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "
            * {
              color: var(colors.magenta, pink);
            }
          "
    `)
  })
})
