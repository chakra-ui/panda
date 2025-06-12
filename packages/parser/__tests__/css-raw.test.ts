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
          "type": "css",
        },
        {
          "data": [
            {
              "bg": "red.400",
            },
          ],
          "name": "css",
          "type": "css",
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
        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: var(--colors-white);
      }
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black);
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        .buttonStyle--size_sm {
          padding: 0 0.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
      }
      }

      @layer utilities {
        .bg_red\\.400 {
          background: var(--colors-red-400);
      }

        .mx_3 {
          margin-inline: var(--spacing-3);
      }

        .mx_10 {
          margin-inline: var(--spacing-10);
      }

        .gap_10px {
          gap: 10px;
      }

        .c_amber\\.100 {
          color: var(--colors-amber-100);
      }

        .c_blue\\.950 {
          color: var(--colors-blue-950);
      }

        .d_flex {
          display: flex;
      }

        .flex-d_column {
          flex-direction: column;
      }

        .flex-d_row {
          flex-direction: row;
      }

        .pt_4 {
          padding-top: var(--spacing-4);
      }

        .pt_6 {
          padding-top: var(--spacing-6);
      }
      }"
    `)
  })
})
