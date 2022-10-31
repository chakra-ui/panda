import { test, expect } from 'vitest'
import postcss from 'postcss'
import { mergeLayers } from './merge-layers'

function run(code: string) {
  return postcss([mergeLayers()]).process(code, { from: undefined })
}

const css = (v: TemplateStringsArray) => v[0]

test('should merge layers', () => {
  const result = run(css`
    @layer reset {
      html {
        box-sizing: border-box;
      }
    }

    @layer components {
      .btn {
        color: red;
      }

      @media sm {
        .btn {
          color: blue;
        }
      }
    }

    @layer components {
      .btn-2 {
        color: blue;
      }
    }
  `)

  expect(result.css).toMatchInlineSnapshot(`
    "
        @layer reset {
          html {
            box-sizing: border-box;
          }
        }

        @layer components {
          .btn {
            color: red;
          }

          @media sm {
            .btn {
              color: blue;
            }
          }
          .btn-2 {
            color: blue;
          }
        }
      "
  `)
})
