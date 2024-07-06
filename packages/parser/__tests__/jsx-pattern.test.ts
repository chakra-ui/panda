import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('jsx pattern', () => {
  test('should extract', () => {
    const code = `
       import { Stack } from "styled-system/jsx"

       function Button() {
         return (
            <div>
               <Stack as="a" align="center" marginTop="40px" marginBottom="42px" dir="rtl">Click me</Stack>
            </div>
        )
       }
     `

    const result = parseAndExtract(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "align": "center",
              "marginBottom": "42px",
              "marginTop": "40px",
            },
          ],
          "name": "Stack",
          "type": "jsx-pattern",
        },
      ]
    `)
  })

  test('custom jsx', () => {
    const code = `
    <Form>
        <Form.Group gap="4">
          <p>Test</p>
          <p>Test</p>
        </Form.Group>
        <Form.Action gap="2">Action</Form.Action>
      </Form>
    `

    const result = parseAndExtract(code, {
      patterns: {
        extend: {
          grid: {
            jsx: ['Form.Group', 'Grid'],
          },
          stack: {
            jsx: ['Form.Action', 'Stack'],
          },
        },
      },
    })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "Form",
          "type": "jsx",
        },
        {
          "data": [
            {
              "gap": "4",
            },
          ],
          "name": "Form.Group",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {
              "gap": "2",
            },
          ],
          "name": "Form.Action",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_grid {
          display: grid;
      }

        .gap_4 {
          gap: var(--spacing-4);
      }

        .d_flex {
          display: flex;
      }

        .gap_2 {
          gap: var(--spacing-2);
      }

        .flex-d_column {
          flex-direction: column;
      }
      }"
    `)
  })
})
