import { describe, test, expect } from 'vitest'
import { getFixtureProject } from './fixture'

describe('jsx', () => {
  test('should extract', () => {
    const code = `
       import { panda, Stack } from ".panda/jsx"

       function Button() {
         return (
            <div marginTop="55555px">
                <Stack>
                    <panda.button marginTop="40px" marginBottom="42px">Click me</panda.button>
                    <panda.div bg="red.200">Click me</panda.div>
                </Stack>
            </div>
        )
       }
     `
    const { parse, generator } = getFixtureProject(code)
    const result = parse()!
    expect(result?.getAll().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "Stack",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {
              "marginBottom": "42px",
              "marginTop": "40px",
            },
          ],
          "name": "panda.button",
          "type": "jsx-factory",
        },
        {
          "data": [
            {
              "bg": "red.200",
            },
          ],
          "name": "panda.div",
          "type": "jsx-factory",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .mt_40px {
          margin-top: 40px
          }

        .mb_42px {
          margin-bottom: 42px
          }

        .bg_red\\\\.200 {
          background: var(--colors-red-200)
          }

        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .items_flex-start {
          align-items: flex-start
          }

        .gap_10px {
          gap: 10px
          }

        .min-w_0 {
          min-width: 0
          }
      }"
    `)
  })
})
