import { describe, test, expect } from 'vitest'
import { getFixtureProject } from './fixture'

describe('jsx', () => {
  test('should extract', () => {
    const code = `
       import { panda, Stack } from ".panda/jsx"
      import { button, anotherButton } from ".panda/recipes"

      function AnotherButtonWithRegex({ children, variant, size, css: cssProp }: ButtonProps) {
        return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
      }

      const AnotherButton = ({ spacing }) => {
        return <button className={cx(anotherButton({ spacing }))}>Hello</button>
      }

       function Button() {
         return (
            <div marginTop="55555px">
                <Stack>
                    <panda.button marginTop="40px" marginBottom="42px">Click me</panda.button>
                    <panda.div bg="red.200">Click me</panda.div>
                    <AnotherButtonWithRegex variant="danger" size="md" />
                    <AnotherButton spacing="sm" />
                </Stack>
            </div>
        )
       }
     `
    const { parse, generator } = getFixtureProject(code, (conf) => ({
      ...conf,
      theme: {
        ...conf.theme,
        recipes: {
          ...conf.theme?.recipes,
          button: {
            name: 'button',
            jsx: ['Button', /WithRegex$/],
            description: 'A button styles',
            base: { fontSize: 'lg' },
            variants: {
              size: {
                sm: { padding: '2', borderRadius: 'sm' },
                md: { padding: '4', borderRadius: 'md' },
              },
              variant: {
                primary: { color: 'white', backgroundColor: 'blue.500' },
                danger: { color: 'white', backgroundColor: 'red.500' },
                secondary: { color: 'pink.300', backgroundColor: 'green.500' },
              },
            },
          },
          anotherButton: {
            name: 'anotherButton',
            jsx: ['AnotherButton'],
            variants: {
              spacing: {
                sm: { padding: '2', borderRadius: 'sm' },
                md: { padding: '4', borderRadius: 'md' },
              },
            },
          },
        },
      },
    }))
    const result = parse()!
    expect(result?.getAll().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {},
          ],
          "name": "button",
          "type": "recipe",
        },
        {
          "data": [
            {
              "size": "md",
              "variant": "danger",
            },
          ],
          "name": "AnotherButtonWithRegex",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "spacing": "sm",
            },
          ],
          "name": "AnotherButton",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "anotherButton",
          "type": "recipe",
        },
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

        .spacing_sm {
          spacing: sm
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
          }}

      @layer recipes {
        .button--size_md {
          padding: var(--spacing-4);
          border-radius: var(--radii-md)
          }

        .button--variant_danger {
          color: white;
          background-color: var(--colors-red-500)
          }

        @layer base {
          .button {
            font-size: var(--font-sizes-lg)
              }
          }
      }"
    `)
  })
})
