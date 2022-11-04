import postcss from 'postcss'
import { expect, test } from 'vitest'
import dedupePlugin from 'postcss-discard-duplicates'
import mergeLayers from '../src/plugins/merge-layers'

function run(code: string) {
  return postcss([mergeLayers(), dedupePlugin()]).process(code, { from: undefined })
}

const css = (v: TemplateStringsArray) => v[0]

test('should merge layers', () => {
  const result = run(css`
    .Button {
      color: red;
      offset-path: path('M 0 0 L 100 0');
    }

    .Button {
      color: blue;
      appearance: none;
    }

    @layer props {
      .mt-2 {
        margin-top: 0.5rem;
      }

      .mt-2 {
        margin-top: 0.5rem;
      }
    }

    @layer props {
      .mt-2 {
        margin-top: 0.5rem;
      }

      .pt-2 {
        padding-top: 0.5rem;
      }

      @media (min-width: 640px) {
        .mt-2 {
          margin-top: 0.9rem;
        }
      }
    }
  `)

  expect(result.css).toMatchInlineSnapshot(`
    "
        .Button {
          color: red;
          offset-path: path('M 0 0 L 100 0');
        }

        .Button {
          color: blue;
          appearance: none;
        }

        @layer props {
          .mt-2 {
            margin-top: 0.5rem;
          }

          .pt-2 {
            padding-top: 0.5rem;
          }

          @media (min-width: 640px) {
            .mt-2 {
              margin-top: 0.9rem;
            }
          }
        }
      "
  `)
})
