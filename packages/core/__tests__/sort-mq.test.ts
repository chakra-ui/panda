import postcss from 'postcss'
import { expect, test } from 'vitest'
import sortMediaQueries from '../src/plugins/sort-mq'

function run(code: string) {
  return postcss([sortMediaQueries()]).process(code, { from: undefined })
}

const css = (v: TemplateStringsArray) => v[0]

test('should sort media queries', () => {
  const result = run(css`
    @media (min-width: 990px) {
      .bg {
        background-color: yellow;
      }
    }

    .bg {
      background-color: red;
    }

    @media (max-width: 1290px) {
      .bg {
        background-color: yellow;
      }
    }

    @media (min-width: 640px) {
      .bg {
        background-color: blue;
      }
    }
  `)

  expect(result.css).toMatchInlineSnapshot(`
    "

        .bg {
          background-color: red;
        }

        @media (min-width: 640px) {
          .bg {
            background-color: blue;
          }
        }
        @media (min-width: 990px) {
          .bg {
            background-color: yellow;
          }
        }

        @media (max-width: 1290px) {
          .bg {
            background-color: yellow;
          }
        }
      "
  `)
})

test('should sort within @layer', () => {
  const result = run(css`
    @layer components {
      .Button {
        font-size: 1rem;
      }

      @media (min-width: 640px) {
        .Button {
          font-size: 1.25rem;
        }
      }

      .Tabs {
        display: flex;
        align-items: center;
      }
    }

    @layer base {
      @media (min-width: 1240px) {
        .py-2 {
          padding-top: 5rem;
        }
      }

      .py-2 {
        padding-top: 0.5rem;
      }

      @media (min-width: 900px) {
        .py-2 {
          padding-top: 1rem;
        }
      }
    }
  `)

  expect(result.css).toMatchInlineSnapshot(`
    "
        @layer components {
          .Button {
            font-size: 1rem;
          }

          .Tabs {
            display: flex;
            align-items: center;
          }

          @media (min-width: 640px) {
            .Button {
              font-size: 1.25rem;
            }
          }
        }

        @layer base {

          .py-2 {
            padding-top: 0.5rem;
          }

          @media (min-width: 900px) {
            .py-2 {
              padding-top: 1rem;
            }
          }
          @media (min-width: 1240px) {
            .py-2 {
              padding-top: 5rem;
            }
          }
        }
      "
  `)
})

test('should sort within nested @layer', () => {
  const result = run(css`
    .py-2 {
      padding-top: 0.5rem;
    }

    @layer recipes {
      .Button {
        font-size: 1rem;
      }

      @layer compositions {
        @media (min-width: 640px) {
          .Button {
            font-size: 1.25rem;
          }
        }

        @media (min-width: 200px) {
          .Button {
            font-size: 1.25rem;
          }
        }

        .Button {
          font-size: 1.2rem;
        }
      }
    }

    .bg-red-500 {
      background-color: red;
    }
  `)

  expect(result.css).toMatchInlineSnapshot(`
    "
        .py-2 {
          padding-top: 0.5rem;
        }

        @layer recipes {
          .Button {
            font-size: 1rem;
          }

          @layer compositions {

            .Button {
              font-size: 1.2rem;
            }

            @media (min-width: 200px) {
              .Button {
                font-size: 1.25rem;
              }
            }
            @media (min-width: 640px) {
              .Button {
                font-size: 1.25rem;
              }
            }
          }
        }

        .bg-red-500 {
          background-color: red;
        }
      "
  `)
})
