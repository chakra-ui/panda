import { describe, test, expect } from 'vitest'
import { getFixtureProject } from './fixture'

describe('extract to css output pipeline', () => {
  test('basic usage', () => {
    const code = `
      import { panda } from ".panda/jsx"
      import { css } from ".panda/css"

       function Button() {
         return (
            <div marginTop="55555px">
              <div className={css({
                color: "blue.100",
                backgroundImage: \`url("https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/media/logo-colored@2x.png?raw=true")\`,
                border: "1px solid token(colors.yellow.100)",
                "--shadow": {
                  base: "colors.orange.100",
                  _dark: "colors.gray.800",
                },
                boxShadow: "0 0 0 4px var(--shadow)",
                outlineColor: "var(--colors-pink-200)",
              })} />
              <panda.div
                p="2"
                m={{
                  base: "1px",
                  sm: "4px",
                  _dark: { _hover: { m: -2 } }
                }}
                css={{
                  md: { p: 4 },
                  _hover: { color: "#2ecc71", backgroundColor: "var(--some-bg)" }
                }}>Click me</panda.div>
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
            {
              "--shadow": {
                "_dark": "colors.gray.800",
                "base": "colors.orange.100",
              },
              "backgroundImage": "url(\\"https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/media/logo-colored@2x.png?raw=true\\")",
              "border": "1px solid token(colors.yellow.100)",
              "boxShadow": "0 0 0 4px var(--shadow)",
              "color": "blue.100",
              "outlineColor": "var(--colors-pink-200)",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "css": {
                "_hover": {
                  "backgroundColor": "var(--some-bg)",
                  "color": "#2ecc71",
                },
                "md": {
                  "p": 4,
                },
              },
              "m": {
                "_dark": {
                  "_hover": {
                    "m": -2,
                  },
                },
                "base": "1px",
                "sm": "4px",
              },
              "p": "2",
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
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }

        .bg-img_url\\\\(\\\\\\"https\\\\:\\\\/\\\\/raw\\\\.githubusercontent\\\\.com\\\\/chakra-ui\\\\/chakra-ui\\\\/main\\\\/media\\\\/logo-colored\\\\@2x\\\\.png\\\\?raw\\\\=true\\\\\\"\\\\) {
          background-image: url(\\"https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/media/logo-colored@2x.png?raw=true\\")
          }

        .border_1px_solid_token\\\\(colors\\\\.yellow\\\\.100\\\\) {
          border: 1px solid var(--colors-yellow-100)
          }

        .\\\\--shadow_colors\\\\.orange\\\\.100 {
          --shadow: var(--colors-orange-100)
          }

        [data-theme=dark] .dark\\\\:--shadow_colors\\\\.gray\\\\.800, .dark .dark\\\\:--shadow_colors\\\\.gray\\\\.800, .dark\\\\:--shadow_colors\\\\.gray\\\\.800.dark, .dark\\\\:--shadow_colors\\\\.gray\\\\.800[data-theme=dark] {
          --shadow: var(--colors-gray-800)
              }

        .shadow_0_0_0_4px_var\\\\(--shadow\\\\) {
          box-shadow: 0 0 0 4px var(--shadow)
          }

        .ring_var\\\\(--colors-pink-200\\\\) {
          outline-color: var(--colors-pink-200)
          }

        .p_2 {
          padding: var(--spacing-2)
          }

        .m_1px {
          margin: 1px
          }

        .hover\\\\:text_\\\\#2ecc71:where(:hover, [data-hover]) {
          color: #2ecc71
              }

        .hover\\\\:bg_var\\\\(--some-bg\\\\):where(:hover, [data-hover]) {
          background-color: var(--some-bg)
              }

        [data-theme=dark] .margin\\\\:dark\\\\:hover\\\\:m_-2:where(:hover, [data-hover]), .dark .margin\\\\:dark\\\\:hover\\\\:m_-2:where(:hover, [data-hover]), .margin\\\\:dark\\\\:hover\\\\:m_-2:where(:hover, [data-hover]).dark, .margin\\\\:dark\\\\:hover\\\\:m_-2:where(:hover, [data-hover])[data-theme=dark] {
          margin: calc(var(--spacing-2) * -1)
                  }

        @media screen and (min-width: 640px) {
          .sm\\\\:m_4px {
            margin: 4px
          }
              }

        @media screen and (min-width: 768px) {
          .md\\\\:p_4 {
            padding: var(--spacing-4)
          }
              }
      }"
    `)
  })

  test('runtime conditions', () => {
    const code = `
      import { css } from ".panda/css"

       function Button() {
        const [isHovered, setIsHovered] = useState(false)

         return (
          <div className={css({ color: isHovered ? "blue.100" : "red.100" })} />
        )
       }
     `
    const { parse, generator } = getFixtureProject(code)
    const result = parse()!
    expect(result?.getAll().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
            {
              "color": "red.100",
            },
            {},
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }

        .text_red\\\\.100 {
          color: var(--colors-red-100)
          }
      }"
    `)
  })

  test('arbitrary selectors', () => {
    const code = `
      import { css } from ".panda/css"

       function Button() {

         return (
          <div className={css({
            [".closed > &"]: {
              color: "green.100",
              _dark: { color: "green.900" }
            },
            ["& + &"]: {
              margin: "-2px",
              _hover: { margin: 0 }
            },
            ["&[data-state='open']"]: {
              cursor: "pointer",
              _before: {
                content: '"👋"',
              }
            },
          })} />
        )
       }
     `
    const { parse, generator } = getFixtureProject(code)
    const result = parse()!
    expect(result?.getAll().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "& + &": {
                "_hover": {
                  "margin": 0,
                },
                "margin": "-2px",
              },
              "&[data-state='open']": {
                "_before": {
                  "content": "\\"👋\\"",
                },
                "cursor": "pointer",
              },
              ".closed > &": {
                "_dark": {
                  "color": "green.900",
                },
                "color": "green.100",
              },
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .closed > .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:text_green\\\\.100 {
          color: var(--colors-green-100)
              }

        .closed > [data-theme=dark] .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900, .closed > .dark .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900, .closed > .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900.dark, .closed > .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900[data-theme=dark] {
          color: var(--colors-green-900)
                  }

        .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:m_-2px + .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:m_-2px {
          margin: -2px
              }

        .\\\\[\\\\&\\\\[data-state\\\\=\\\\'open\\\\'\\\\]\\\\]\\\\:cursor_pointer[data-state='open'] {
          cursor: pointer
              }

        .\\\\[\\\\&\\\\[data-state\\\\=\\\\'open\\\\'\\\\]\\\\]\\\\:before\\\\:content_\\\\\\"👋\\\\\\"[data-state='open']::before {
          content: \\"👋\\"
                  }

        .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:hover\\\\:m_0 + .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:hover\\\\:m_0:where(:hover, [data-hover]) {
          margin: 0
                  }
      }"
    `)
  })

  test('colorPalette', () => {
    const code = `
      import { css } from ".panda/css"

       function Button() {
         return (
          <div className={css({ colorPalette: "blue", bg: "colorPalette.100", _hover: { color: "colorPalette.300" } })} />
        )
       }
     `
    const { parse, generator } = getFixtureProject(code)
    const result = parse()!
    expect(result?.getAll().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "_hover": {
                "color": "colorPalette.300",
              },
              "bg": "colorPalette.100",
              "colorPalette": "blue",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .color-palette_blue {
          --colors-color-palette-50: var(--colors-blue-50);
          --colors-color-palette-100: var(--colors-blue-100);
          --colors-color-palette-200: var(--colors-blue-200);
          --colors-color-palette-300: var(--colors-blue-300);
          --colors-color-palette-400: var(--colors-blue-400);
          --colors-color-palette-500: var(--colors-blue-500);
          --colors-color-palette-600: var(--colors-blue-600);
          --colors-color-palette-700: var(--colors-blue-700);
          --colors-color-palette-800: var(--colors-blue-800);
          --colors-color-palette-900: var(--colors-blue-900)
          }

        .bg_colorPalette\\\\.100 {
          background: var(--colors-color-palette-100)
          }

        .hover\\\\:text_colorPalette\\\\.300:where(:hover, [data-hover]) {
          color: var(--colors-color-palette-300)
              }
      }"
    `)
  })

  test('patterns', () => {
    const code = `
      import { stack, hstack as aliased } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={stack({ align: "center" })}>Click me</div>
              <div className={aliased({ justify: "flex-end" })}>Click me</div>
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
            {
              "align": "center",
            },
          ],
          "name": "stack",
          "type": "pattern",
        },
        {
          "data": [
            {
              "justify": "flex-end",
            },
          ],
          "name": "hstack",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .flex_column {
          flex-direction: column
          }

        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_flex-end {
          justify-content: flex-end
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

  test('should extract config recipes', () => {
    const code = `
       import { panda, Stack } from ".panda/jsx"
      import { button, anotherButton, complexButton } from ".panda/recipes"

      function AnotherButtonWithRegex({ children, variant, size, css: cssProp }: ButtonProps) {
        return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
      }

      const AnotherButton = ({ spacing }) => {
        return <button className={cx(anotherButton({ spacing }))}>Hello</button>
      }

      const ComplexDesignSystemButton = ({ color }) => {
        return <button className={cx(complexButton({ color }))}>Hello</button>
      }

       function Button() {
         return (
            <div marginTop="55555px">
                <Stack>
                    <panda.button marginTop="40px" marginBottom="42px">Click me</panda.button>
                    <panda.div bg="red.200">Click me</panda.div>
                    <AnotherButtonWithRegex variant="danger" size="md" />
                    <AnotherButton spacing="sm" />
                    <ComplexDesignSystemButton color="blue" />
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
            compoundVariants: [{ variant: 'danger', size: 'md', css: { zIndex: 100 } }],
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
          complexButton: {
            name: 'complexButton',
            jsx: ['ComplexButton', /^Complex.+Button$/],
            variants: {
              color: {
                blue: { color: 'blue.500' },
                red: { color: 'red.500' },
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
            {},
          ],
          "name": "anotherButton",
          "type": "recipe",
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
          "name": "complexButton",
          "type": "recipe",
        },
        {
          "data": [
            {
              "color": "blue",
            },
          ],
          "name": "ComplexDesignSystemButton",
          "type": "jsx-recipe",
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

        .z_100 {
          z-index: 100
          }

        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .gap_10px {
          gap: 10px
          }}

      @layer recipes {
        .button--size_md {
          padding: var(--spacing-4);
          border-radius: var(--radii-md)
          }

        .button--variant_danger {
          color: var(--colors-white);
          background-color: var(--colors-red-500)
          }

        .anotherButton--spacing_sm {
          padding: var(--spacing-2);
          border-radius: var(--radii-sm)
          }

        .complexButton--color_blue {
          color: var(--colors-blue-500)
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

describe('preset patterns', () => {
  // stack vstack hstack spacer circle absoluteCenter grid gridItem wrap container center aspectRatio
  test('box', () => {
    const code = `
      import { box } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={box({ color: "blue.100" })}>Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "box",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('jsx box', () => {
    const code = `
      import { Box } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Box color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('flex', () => {
    const code = `
      import { flex } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={flex()}>Click me</div>
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
          "name": "flex",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }
      }"
    `)
  })

  test('jsx flex', () => {
    const code = `
      import { Flex } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Flex color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Flex",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('stack', () => {
    const code = `
      import { stack } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={stack()}>Click me</div>
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
          "name": "stack",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('jsx stack', () => {
    const code = `
      import { Stack } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Stack color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Stack",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .gap_10px {
          gap: 10px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('vstack', () => {
    const code = `
      import { vstack } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={vstack()}>Click me</div>
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
          "name": "vstack",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_column {
          flex-direction: column
          }
      }"
    `)
  })

  test('jsx vStack', () => {
    const code = `
      import { VStack } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <VStack color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "VStack",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_column {
          flex-direction: column
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('hstack', () => {
    const code = `
      import { hstack } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={hstack()}>Click me</div>
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
          "name": "hstack",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
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

  test('jsx hStack', () => {
    const code = `
      import { HStack } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <HStack color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "HStack",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .gap_10px {
          gap: 10px
          }

        .flex_row {
          flex-direction: row
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('spacer', () => {
    const code = `
      import { spacer } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={spacer()}>Click me</div>
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
          "name": "spacer",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .self_stretch {
          align-self: stretch
          }

        .justify-self_stretch {
          justify-self: stretch
          }

        .flex_1 {
          flex: 1 1 0%
          }
      }"
    `)
  })

  test('jsx spacer', () => {
    const code = `
      import { Spacer } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Spacer color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Spacer",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .self_stretch {
          align-self: stretch
          }

        .justify-self_stretch {
          justify-self: stretch
          }

        .flex_1 {
          flex: 1 1 0%
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('circle', () => {
    const code = `
      import { circle } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={circle()}>Click me</div>
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
          "name": "circle",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }

        .flex_0_0_auto {
          flex: 0 0 auto
          }

        .rounded_9999px {
          border-radius: 9999px
          }
      }"
    `)
  })

  test('jsx circle', () => {
    const code = `
      import { Circle } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Circle color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Circle",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }

        .flex_0_0_auto {
          flex: 0 0 auto
          }

        .rounded_9999px {
          border-radius: 9999px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('absoluteCenter', () => {
    const code = `
      import { absoluteCenter } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={absoluteCenter()}>Click me</div>
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
          "name": "absoluteCenter",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_absolute {
          position: absolute
          }

        .inset-t_50\\\\% {
          inset-block-start: 50%
          }

        .start_50\\\\% {
          inset-inline-start: 50%
          }

        .transform_translate\\\\(-50\\\\%\\\\,_-50\\\\%\\\\) {
          transform: translate(-50%, -50%)
          }

        .max-w_100\\\\% {
          max-width: 100%
          }

        .max-h_100\\\\% {
          max-height: 100%
          }
      }"
    `)
  })

  test('jsx absoluteCenter', () => {
    const code = `
      import { AbsoluteCenter } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <AbsoluteCenter color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "AbsoluteCenter",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_absolute {
          position: absolute
          }

        .inset-t_50\\\\% {
          inset-block-start: 50%
          }

        .start_50\\\\% {
          inset-inline-start: 50%
          }

        .transform_translate\\\\(-50\\\\%\\\\,_-50\\\\%\\\\) {
          transform: translate(-50%, -50%)
          }

        .max-w_100\\\\% {
          max-width: 100%
          }

        .max-h_100\\\\% {
          max-height: 100%
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('grid', () => {
    const code = `
      import { grid } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={grid()}>Click me</div>
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
          "name": "grid",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_grid {
          display: grid
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('jsx grid', () => {
    const code = `
      import { Grid } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Grid color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Grid",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_grid {
          display: grid
          }

        .gap_10px {
          gap: 10px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('gridItem', () => {
    const code = `
      import { gridItem } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={gridItem()}>Click me</div>
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
          "name": "gridItem",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot('""')
  })

  test('jsx gridItem', () => {
    const code = `
      import { GridItem } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <GridItem color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "GridItem",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('wrap', () => {
    const code = `
      import { wrap } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={wrap()}>Click me</div>
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
          "name": "wrap",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex-wrap_wrap {
          flex-wrap: wrap
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('jsx wrap', () => {
    const code = `
      import { Wrap } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Wrap color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Wrap",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .flex-wrap_wrap {
          flex-wrap: wrap
          }

        .gap_10px {
          gap: 10px
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('container', () => {
    const code = `
      import { container } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={container()}>Click me</div>
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
          "name": "container",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .w_100\\\\% {
          width: 100%
          }

        .max-w_60ch {
          max-width: 60ch
          }

        .mx_auto {
          margin-inline: auto
          }
      }"
    `)
  })

  test('jsx container', () => {
    const code = `
      import { Container } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Container color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Container",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .w_100\\\\% {
          width: 100%
          }

        .max-w_60ch {
          max-width: 60ch
          }

        .mx_auto {
          margin-inline: auto
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('center', () => {
    const code = `
      import { center } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={center()}>Click me</div>
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
          "name": "center",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }
      }"
    `)
  })

  test('jsx center', () => {
    const code = `
      import { Center } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Center color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "Center",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_flex {
          display: flex
          }

        .items_center {
          align-items: center
          }

        .justify_center {
          justify-content: center
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })

  test('aspectRatio', () => {
    const code = `
      import { aspectRatio } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={aspectRatio()}>Click me</div>
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
          "name": "aspectRatio",
          "type": "pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .overflow_hidden {
          overflow: hidden
          }

        .d_flex {
          display: flex
          }

        .justify_center {
          justify-content: center
          }

        .items_center {
          align-items: center
          }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:w_100\\\\%>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:w_100\\\\%>video {
          width: 100%
              }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:h_100\\\\%>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:h_100\\\\%>video {
          height: 100%
              }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>video {
          object-fit: cover
              }
      }"
    `)
  })

  test('jsx aspectRatio', () => {
    const code = `
      import { AspectRatio } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <AspectRatio color="blue.100">Click me</div>
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
            {
              "color": "blue.100",
            },
          ],
          "name": "AspectRatio",
          "type": "jsx-pattern",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .overflow_hidden {
          overflow: hidden
          }

        .d_flex {
          display: flex
          }

        .justify_center {
          justify-content: center
          }

        .items_center {
          align-items: center
          }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:w_100\\\\%>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:w_100\\\\%>video {
          width: 100%
              }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:h_100\\\\%>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:h_100\\\\%>video {
          height: 100%
              }

        .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>img, .\\\\[\\\\&\\\\>img\\\\,_\\\\&\\\\>video\\\\]\\\\:object_cover>video {
          object-fit: cover
              }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }
      }"
    `)
  })
})
