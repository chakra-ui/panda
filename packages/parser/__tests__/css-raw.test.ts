import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('{fn}.raw', () => {
  test('using raw syntax works', () => {
    const code = `
        import { css } from "styled-system/css";
        import { buttonStyle } from "styled-system/recipes";
        import { stack } from "styled-system/patterns";

        const filePath = String.raw\`C:\\Development\\profile\\aboutme.html\`;

        css.raw({ mx: '3', paddingTop: '4', color: 'amber.100' }, { mx: '10', pt: '6', color: 'blue.950' })

        export default function App() {
          return (
            <ButtonStyle rootProps={css.raw({ bg: "red.400" })} />
          );
        }

        // recipe in storybook
        export const Funky: Story = {
          args: buttonStyle.raw({
            visual: "funky",
            shape: "circle",
            size: "sm",
          }),
        };

        // mixed with pattern
        const stackProps = {
          sm: stack.raw({ direction: "column" }),
          md: stack.raw({ direction: "row" })
        }

        stack(stackProps[props.size]))

         `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "amber.100",
              "mx": "3",
              "paddingTop": "4",
            },
            {
              "color": "blue.950",
              "mx": "10",
              "pt": "6",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "bg": "red.400",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {},
          ],
          "name": "ButtonStyle",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "shape": "circle",
              "size": "sm",
              "visual": "funky",
            },
          ],
          "name": "buttonStyle",
          "type": "recipe",
        },
        {
          "data": [
            {
              "direction": "column",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "direction": "row",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {},
          ],
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black);
      }

        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
      }
      }
      }

      @layer utilities {
        .mx_3 {
          margin-inline: var(--spacing-3)
      }

        .pt_4 {
          padding-top: var(--spacing-4)
      }

        .text_amber\\\\.100 {
          color: var(--colors-amber-100)
      }

        .mx_10 {
          margin-inline: var(--spacing-10)
      }

        .pt_6 {
          padding-top: var(--spacing-6)
      }

        .text_blue\\\\.950 {
          color: var(--colors-blue-950)
      }

        .bg_red\\\\.400 {
          background: var(--colors-red-400)
      }

        .d_flex {
          display: flex
      }

        .flex_column {
          flex-direction: column
      }

        .gap_10px {
          gap: 10px
      }

        .flex_row {
          flex-direction: row
      }
      }"
    `)
  })
})
