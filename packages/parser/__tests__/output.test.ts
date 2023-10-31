import { describe, test, expect } from 'vitest'
import { getFixtureProject } from './fixture'
import type { Config, TSConfig } from '@pandacss/types'

const run = (code: string, userConfig?: Config, tsconfig?: TSConfig) => {
  const { parse, generator } = getFixtureProject(code, userConfig, tsconfig)
  const result = parse()!
  return {
    json: result?.toArray().map(({ box, ...item }) => item),
    css: generator.getParserCss(result)!,
  }
}

describe('extract to css output pipeline', () => {
  test('basic usage', () => {
    const code = `
      import { panda } from ".panda/jsx"
      import { css } from ".panda/css"

      const color = "red.100";

       function Button({ position = "relative", inset: aliasedInset = 0, ...props }) {
         return (
            <div marginTop="55555px">
              <div className={css({
                position,
                inset: aliasedInset,
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
                debug
                p="2"
                m={{
                  color,
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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
              "inset": 0,
              "outlineColor": "var(--colors-pink-200)",
              "position": "relative",
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
              "debug": true,
              "m": {
                "_dark": {
                  "_hover": {
                    "m": -2,
                  },
                },
                "base": "1px",
                "color": "red.100",
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

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .inset_0 {
          inset: var(--spacing-0)
          }

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

        .debug_true {
          outline: 1px solid blue !important;
          }

        .debug_true>* {
          outline: 1px solid red !important
              }

        .p_2 {
          padding: var(--spacing-2)
          }

        .margin\\\\:text_red\\\\.100 {
          color: var(--colors-red-100)
          }

        .m_1px {
          margin: 1px
          }

        .hover\\\\:text_\\\\#2ecc71:is(:hover, [data-hover]) {
          color: #2ecc71
              }

        .hover\\\\:bg_var\\\\(--some-bg\\\\):is(:hover, [data-hover]) {
          background-color: var(--some-bg)
              }

        [data-theme=dark] .margin\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover]), .dark .margin\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover]), .margin\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover]).dark, .margin\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover])[data-theme=dark] {
          margin: calc(var(--spacing-2) * -1)
                  }

        @media screen and (min-width: 40em) {
          .sm\\\\:m_4px {
            margin: 4px
          }
              }

        @media screen and (min-width: 48em) {
          .md\\\\:p_4 {
            padding: var(--spacing-4)
          }
              }
      }"
    `)
  })

  test('basic usage with multiple style objects', () => {
    const code = `
      import { css } from ".panda/css"

      css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "mx": "3",
              "paddingTop": "4",
            },
            {
              "mx": "10",
              "pt": "6",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .mx_3 {
          margin-inline: var(--spacing-3)
          }

        .pt_4 {
          padding-top: var(--spacing-4)
          }

        .mx_10 {
          margin-inline: var(--spacing-10)
          }

        .pt_6 {
          padding-top: var(--spacing-6)
          }
      }"
    `)
  })

  test('multiple recipes on 1 component', () => {
    const code = `
    import { button, pinkRecipe, greenRecipe, blueRecipe, sizeRecipe, bgRecipe } from ".panda/recipes"

    const ComponentWithMultipleRecipes = ({ variant, size, color }) => {
      return <button className={cx(pinkRecipe({ variant }), greenRecipe({ variant }), blueRecipe({ variant }), sizeRecipe({ size }), bgRecipe({ color }))}>Hello</button>
    }


    export default function Page() {
      return (
        <>
          <ComponentWithMultipleRecipes variant="small" size="medium" color="yellow" />
        </>
      )
    }
     `
    const result = run(code, {
      theme: {
        extend: {
          recipes: {
            pinkRecipe: {
              className: 'pinkRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              base: { color: 'pink.100' },
              variants: {
                variant: {
                  small: { fontSize: 'sm' },
                },
              },
            },
            greenRecipe: {
              className: 'greenRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              base: { color: 'green.100' },
              variants: {
                variant: {
                  small: { fontSize: 'sm' },
                },
              },
            },
            blueRecipe: {
              className: 'blueRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              base: { color: 'blue.100' },
              variants: {
                variant: {
                  small: { fontSize: 'sm' },
                },
              },
            },
            sizeRecipe: {
              className: 'sizeRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              variants: {
                size: {
                  medium: { fontSize: 'md' },
                  large: { fontSize: 'lg' },
                },
              },
            },
            bgRecipe: {
              className: 'bgRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              variants: {
                color: {
                  yellow: { backgroundColor: 'yellow.100' },
                },
              },
            },
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
          "name": "pinkRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {
              "color": "yellow",
              "size": "medium",
              "variant": "small",
            },
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "greenRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {
              "color": "yellow",
              "size": "medium",
              "variant": "small",
            },
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "blueRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {
              "color": "yellow",
              "size": "medium",
              "variant": "small",
            },
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "sizeRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {
              "color": "yellow",
              "size": "medium",
              "variant": "small",
            },
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "bgRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {
              "color": "yellow",
              "size": "medium",
              "variant": "small",
            },
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        .pinkRecipe--variant_small,.greenRecipe--variant_small,.blueRecipe--variant_small {
          font-size: var(--font-sizes-sm)
          }

        .sizeRecipe--size_medium {
          font-size: var(--font-sizes-md)
          }

        .bgRecipe--color_yellow {
          background-color: var(--colors-yellow-100)
          }

        @layer _base {
          .pinkRecipe {
            color: var(--colors-pink-100)
              }

          .greenRecipe {
            color: var(--colors-green-100)
              }

          .blueRecipe {
            color: var(--colors-blue-100)
              }
          }
      }

      @layer utilities {
        .text_yellow {
          color: yellow
          }
      }"
    `)
  })

  test('multiple recipes on 1 component using {recipe}.raw', () => {
    const code = `
    import { button, pinkRecipe, sizeRecipe, bgRecipe } from ".panda/recipes"

    const ComponentWithMultipleRecipes = ({ pinkProps: { variant } = {}, sizeProps: { size } = {}, colorProps: { color } = {} }) => {
      return <button className={cx(pinkRecipe({ variant }), sizeRecipe({ size }), bgRecipe({ color }))}>Hello</button>
    }


    export default function Page() {
      return (
        <>
          <ComponentWithMultipleRecipes
            pinkProps={pinkRecipe.raw({ variant: "small" })}
            sizeProps={sizeRecipe.raw({ size: "medium" })}
            bgProps={bgRecipe.raw({ color: "yellow" })}
          />
        </>
      )
    }
     `
    const result = run(code, {
      theme: {
        extend: {
          recipes: {
            pinkRecipe: {
              className: 'pinkRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              base: { color: 'pink.100' },
              variants: {
                variant: {
                  small: { fontSize: 'sm' },
                },
              },
            },
            sizeRecipe: {
              className: 'sizeRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              variants: {
                size: {
                  medium: { fontSize: 'md' },
                  large: { fontSize: 'lg' },
                },
              },
            },
            bgRecipe: {
              className: 'bgRecipe',
              jsx: ['ComponentWithMultipleRecipes'],
              variants: {
                color: {
                  yellow: { backgroundColor: 'yellow.100' },
                },
              },
            },
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
          "name": "pinkRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "variant": "small",
            },
          ],
          "name": "pinkRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "sizeRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "size": "medium",
            },
          ],
          "name": "sizeRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "bgRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "color": "yellow",
            },
          ],
          "name": "bgRecipe",
          "type": "recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "ComponentWithMultipleRecipes",
          "type": "jsx-recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        .pinkRecipe--variant_small {
          font-size: var(--font-sizes-sm)
          }

        .sizeRecipe--size_medium {
          font-size: var(--font-sizes-md)
          }

        .bgRecipe--color_yellow {
          background-color: var(--colors-yellow-100)
          }

        @layer _base {
          .pinkRecipe {
            color: var(--colors-pink-100)
              }
          }
      }"
    `)
  })

  test('empty rules', () => {
    const code = `
    import { SectionLearn } from '@/components/sections/learn'
    import { SectionVideos } from '@/components/sections/learn-video'

    export default function Page() {
      return (
        <>
          <SectionLearn />
          <SectionVideos />
        </>
      )
    }

     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "SectionLearn",
          "type": "jsx",
        },
        {
          "data": [
            {},
          ],
          "name": "SectionVideos",
          "type": "jsx",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot('""')
  })

  test('string literal - factory', () => {
    const code = `
    import { panda } from ".panda/jsx"

    const Example = panda('span')\`
      color: lightgreen;

      & > strong {
        color: hotpink;
      }
    \`

    const baseStyle = panda.div\`
        background: transparent;
        border-radius: 3px;
        border: 1px solid var(--accent-color);
        color: token(colors.blue.100);
        display: inline-block;
        margin: 0.5rem 1rem;
        padding: 0.5rem 0;
        transition: all 200ms ease-in-out;
        width: 11rem;
        &:hover {
          filter: brightness(0.85);
          &:disabled {
            filter: brightness(1);
          }
        }
        @media (min-width: 768px) {
          padding: 1rem 0;
          &:disabled {
            filter: brightness(1);
          }
        }
    \`
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              " & > strong": {
                "color": "hotpink",
              },
              "color": "lightgreen",
            },
          ],
          "name": "panda",
          "type": "object",
        },
        {
          "data": [
            {
              " &:hover": {
                " &:disabled": {
                  "filter": "brightness(1)",
                },
                "filter": "brightness(0.85)",
              },
              "@media (min-width: 768px)": {
                " &:disabled": {
                  "filter": "brightness(1)",
                },
                "padding": "1rem 0",
              },
              "background": "transparent",
              "border": "1px solid var(--accent-color)",
              "border-radius": "3px",
              "color": "token(colors.blue.100)",
              "display": "inline-block",
              "margin": "0.5rem 1rem",
              "padding": "0.5rem 0",
              "transition": "all 200ms ease-in-out",
              "width": "11rem",
            },
          ],
          "name": "panda.div",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_lightgreen {
          color: lightgreen
          }

        .\\\\[\\\\&_\\\\>_strong\\\\]\\\\:text_hotpink > strong {
          color: hotpink
              }

        .bg_transparent {
          background: var(--colors-transparent)
          }

        .border-radius_3px {
          border-radius: 3px
          }

        .border_1px_solid_var\\\\(--accent-color\\\\) {
          border: 1px solid var(--accent-color)
          }

        .text_token\\\\(colors\\\\.blue\\\\.100\\\\) {
          color: var(--colors-blue-100)
          }

        .d_inline-block {
          display: inline-block
          }

        .m_0\\\\.5rem_1rem {
          margin: 0.5rem 1rem
          }

        .p_0\\\\.5rem_0 {
          padding: 0.5rem 0
          }

        .transition_all_200ms_ease-in-out {
          transition: all 200ms ease-in-out
          }

        .w_11rem {
          width: 11rem
          }

        .\\\\[\\\\&\\\\:hover\\\\]\\\\:filter_brightness\\\\(0\\\\.85\\\\):hover {
          filter: brightness(0.85)
              }

        .\\\\[\\\\&\\\\:hover\\\\]\\\\:\\\\[\\\\&\\\\:disabled\\\\]\\\\:filter_brightness\\\\(1\\\\):hover:disabled {
          filter: brightness(1)
                  }

        @media (min-width: 768px) {
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:disabled\\\\]\\\\:filter_brightness\\\\(1\\\\):disabled {
            filter: brightness(1)
              }
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:p_1rem_0 {
            padding: 1rem 0
          }
                  }
      }"
    `)
  })

  test('string literal - css', () => {
    const code = `
    import { css } from ".panda/css"

    const className = css\`
        background: transparent;
        border-radius: 3px;
        border: 1px solid var(--accent-color);
        color: token(colors.blue.100);
    \`
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "background": "transparent",
              "border": "1px solid var(--accent-color)",
              "border-radius": "3px",
              "color": "token(colors.blue.100)",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_transparent {
          background: var(--colors-transparent)
          }

        .border-radius_3px {
          border-radius: 3px
          }

        .border_1px_solid_var\\\\(--accent-color\\\\) {
          border: 1px solid var(--accent-color)
          }

        .text_token\\\\(colors\\\\.blue\\\\.100\\\\) {
          color: var(--colors-blue-100)
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

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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

        .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:hover\\\\:m_0 + .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:hover\\\\:m_0:is(:hover, [data-hover]) {
          margin: var(--spacing-0)
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
          --colors-color-palette-900: var(--colors-blue-900);
          --colors-color-palette-950: var(--colors-blue-950)
          }

        .bg_colorPalette\\\\.100 {
          background: var(--colors-color-palette-100)
          }

        .hover\\\\:text_colorPalette\\\\.300:is(:hover, [data-hover]) {
          color: var(--colors-color-palette-300)
              }
      }"
    `)
  })

  // https://github.com/chakra-ui/panda/issues/1062
  describe('issue 1062: expand colorPalette flexibility', () => {
    test('should extract color palette with more than one level of nesting', () => {
      const code = `
      import { css } from ".panda/css"

      export const App = () => {
        return (
          <>
            <button
              className={css({
                colorPalette: 'button',
                color: 'colorPalette.light',
                backgroundColor: 'colorPalette.dark',
                _hover: {
                  color: 'colorPalette.light.accent',
                  background: 'colorPalette.light.accent.secondary',
                },
              })}
            >
              Root color palette
            </button>
            <button
              className={css({
                colorPalette: 'button.light',
                color: 'colorPalette.accent',
                background: 'colorPalette.accent.secondary',
              })}
            >
              One level deep nested color palette
            </button>
            <button
              className={css({
                colorPalette: 'button.light.accent',
                color: 'colorPalette.secondary',
              })}
            >
              Nested color palette leaf
            </button>
          </>
        );
      };
     `
      const result = run(code, {
        theme: {
          extend: {
            semanticTokens: {
              colors: {
                button: {
                  dark: {
                    value: 'navy',
                  },
                  light: {
                    DEFAULT: {
                      value: 'skyblue',
                    },
                    accent: {
                      DEFAULT: {
                        value: 'cyan',
                      },
                      secondary: {
                        value: 'blue',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.json).toMatchInlineSnapshot(`
        [
          {
            "data": [
              {
                "_hover": {
                  "background": "colorPalette.light.accent.secondary",
                  "color": "colorPalette.light.accent",
                },
                "backgroundColor": "colorPalette.dark",
                "color": "colorPalette.light",
                "colorPalette": "button",
              },
            ],
            "name": "css",
            "type": "object",
          },
          {
            "data": [
              {
                "background": "colorPalette.accent.secondary",
                "color": "colorPalette.accent",
                "colorPalette": "button.light",
              },
            ],
            "name": "css",
            "type": "object",
          },
          {
            "data": [
              {
                "color": "colorPalette.secondary",
                "colorPalette": "button.light.accent",
              },
            ],
            "name": "css",
            "type": "object",
          },
        ]
      `)

      expect(result.css).toMatchInlineSnapshot(`
        "@layer utilities {
          .color-palette_button {
            --colors-color-palette-thick: var(--colors-button-thick);
            --colors-color-palette-card-body: var(--colors-button-card-body);
            --colors-color-palette-card-heading: var(--colors-button-card-heading);
            --colors-color-palette-dark: var(--colors-button-dark);
            --colors-color-palette-light: var(--colors-button-light);
            --colors-color-palette-light-accent: var(--colors-button-light-accent);
            --colors-color-palette-light-accent-secondary: var(--colors-button-light-accent-secondary)
            }

          .text_colorPalette\\\\.light {
            color: var(--colors-color-palette-light)
            }

          .bg_colorPalette\\\\.dark {
            background-color: var(--colors-color-palette-dark)
            }

          .color-palette_button\\\\.light {
            --colors-color-palette-accent: var(--colors-button-light-accent);
            --colors-color-palette-accent-secondary: var(--colors-button-light-accent-secondary)
            }

          .text_colorPalette\\\\.accent {
            color: var(--colors-color-palette-accent)
            }

          .bg_colorPalette\\\\.accent\\\\.secondary {
            background: var(--colors-color-palette-accent-secondary)
            }

          .color-palette_button\\\\.light\\\\.accent {
            --colors-color-palette-secondary: var(--colors-button-light-accent-secondary)
            }

          .text_colorPalette\\\\.secondary {
            color: var(--colors-color-palette-secondary)
            }

          .hover\\\\:text_colorPalette\\\\.light\\\\.accent:is(:hover, [data-hover]) {
            color: var(--colors-color-palette-light-accent)
                }

          .hover\\\\:bg_colorPalette\\\\.light\\\\.accent\\\\.secondary:is(:hover, [data-hover]) {
            background: var(--colors-color-palette-light-accent-secondary)
                }
        }"
      `)
    })
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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

  test('jsx patterns + custom wrapper', () => {
    const code = `
      import { stack } from ".panda/patterns"

      const CustomStack = ({ align = "center", ...props }) => (
        <div className={stack({ align, ...props })} />
      )

      function Button() {
        return (
          <div>
              <CustomStack align="flex-end">Click me</CustomStack>
          </div>
        )
      }
     `
    const result = run(code, {
      patterns: {
        extend: {
          stack: {
            jsx: ['CustomStack'],
          },
        },
      },
    })
    expect(result.json).toMatchInlineSnapshot(`
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
              "align": "flex-end",
            },
          ],
          "name": "CustomStack",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .items_center {
          align-items: center
          }

        .d_flex {
          display: flex
          }

        .flex_column {
          flex-direction: column
          }

        .items_flex-end {
          align-items: flex-end
          }

        .gap_10px {
          gap: 10px
          }
      }"
    `)
  })

  test('factory css', () => {
    const code = `
    import { panda } from ".panda/jsx"

    // PropertyAccess factory css
    panda.div({
      color: "red.100",
    })

    // CallExpression factory css
    panda("div", {
        color: "yellow.100",
    })

    // TaggedTemplateExpression factory css
    panda.div\`
      color: var(--colors-purple-100);
    \`
   `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red.100",
            },
          ],
          "name": "panda.div",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "var(--colors-purple-100)",
            },
          ],
          "name": "panda.div",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "yellow.100",
            },
          ],
          "name": "panda",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_red\\\\.100 {
          color: var(--colors-red-100)
          }

        .text_var\\\\(--colors-purple-100\\\\) {
          color: var(--colors-purple-100)
          }

        .text_yellow\\\\.100 {
          color: var(--colors-yellow-100)
          }
      }"
    `)
  })

  test('cva and factory recipes', () => {
    const code = `
      import { panda } from ".panda/jsx"
      import { cva } from ".panda/css"

      // PropertyAccess factory inline recipe
      panda.div({
        base: {
          color: "blue.100",
        },
        variants: {
          //
        }
      })

      // CallExpression factory inline recipe
      panda("div", {
        base: {
          color: "green.100",
        },
        variants: {
          //
        }
      })

      // PropertyAccess factory + cva
      panda.div(cva({
        base: {
          color: "rose.100",
        },
      }))

      const buttonRecipe = cva({
        base: {
          color: "sky.100",
          bg: "red.900",
        }
      })

      function App () {
        return (
          <>
            <Input />
          </>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "panda.div",
          "type": "object",
        },
        {
          "data": [
            {
              "base": {
                "color": "blue.100",
              },
              "variants": {},
            },
          ],
          "name": "panda.div",
          "type": "cva",
        },
        {
          "data": [
            {
              "base": {
                "color": "green.100",
              },
              "variants": {},
            },
          ],
          "name": "panda",
          "type": "cva",
        },
        {
          "data": [
            {
              "base": {
                "color": "rose.100",
              },
            },
          ],
          "name": "cva",
          "type": "object",
        },
        {
          "data": [
            {
              "base": {
                "bg": "red.900",
                "color": "sky.100",
              },
            },
          ],
          "name": "cva",
          "type": "object",
        },
        {
          "data": [
            {},
          ],
          "name": "Input",
          "type": "jsx",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }

        .text_green\\\\.100 {
          color: var(--colors-green-100)
          }

        .text_rose\\\\.100 {
          color: var(--colors-rose-100)
          }

        .text_sky\\\\.100 {
          color: var(--colors-sky-100)
          }

        .bg_red\\\\.900 {
          background: var(--colors-red-900)
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
    const { parse, generator } = getFixtureProject(code, {
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'button',
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
              className: 'anotherButton',
              jsx: ['AnotherButton'],
              variants: {
                spacing: {
                  sm: { padding: '2', borderRadius: 'sm' },
                  md: { padding: '4', borderRadius: 'md' },
                },
              },
            },
            complexButton: {
              className: 'complexButton',
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
      },
    })
    const result = parse()!
    expect(result?.toArray().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
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
          }
      }

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

        @layer _base {
          .button {
            font-size: var(--font-sizes-lg)
              }
          }
      }"
    `)
  })

  test('should allow JSX props along with recipe components', () => {
    const code = `
    import { styled, type HTMLStyledProps } from 'styled-system/jsx';
    type ButtonProps = HTMLStyledProps<'button'>;
    const StyledButton = styled('button', { base: { padding: 'md' } });

    const Button = ({ children, ...props }: ButtonProps) => (
      <StyledButton {...props}>{children}</StyledButton>
    );

    const TomatoButton = (props: ButtonProps) => (
      <Button backgroundColor="tomato" {...props} />
    );

    export const App = () => {
      return (
        <>
          <div>
            <TomatoButton>Button</TomatoButton>
            <Button backgroundColor="yellow">Button</Button>
            <TomatoButton color="purple" css={{ color: "pink" }}>Button</TomatoButton>
          </div>
        </>
      );
    };

     `
    const { parse, generator } = getFixtureProject(code, {
      outdir: 'styled-system',
      jsxFactory: 'styled',
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'my-button',
              jsx: [/Button.*/],
            },
          },
        },
      },
    })
    const result = parse()!
    expect(result?.toArray().map(({ box, ...item }) => item)).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "StyledButton",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "backgroundColor": "tomato",
            },
          ],
          "name": "Button",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "backgroundColor": "yellow",
            },
          ],
          "name": "Button",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "TomatoButton",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {
              "color": "purple",
              "css": {
                "color": "pink",
              },
            },
          ],
          "name": "TomatoButton",
          "type": "jsx-recipe",
        },
      ]
    `)
    const css = generator.getParserCss(result)!
    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_tomato {
          background-color: tomato
          }

        .bg_yellow {
          background-color: yellow
          }

        .text_purple {
          color: purple
          }

        .text_pink {
          color: pink
          }
      }"
    `)
  })

  test('should evaluate ${fn}.raw inside another ${fn}.raw to allow for composition', () => {
    const code = `
    import { css } from 'styled-system/css'

    const paragraphSpacingStyle = css.raw({
      "&:not(:first-child)": { marginBlockEnd: "1em" },
    });

    export const proseCss = css.raw({
      maxWidth: "800px",
      "& p": {
        "&:not(:first-child)": { marginBlockStart: "1em" },
      },
      "& h1": paragraphSpacingStyle,
      "& h2": paragraphSpacingStyle,
    });`

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "&:not(:first-child)": {
                "marginBlockEnd": "1em",
              },
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "& h1": {
                "&:not(:first-child)": {
                  "marginBlockEnd": "1em",
                },
              },
              "& h2": {
                "&:not(:first-child)": {
                  "marginBlockEnd": "1em",
                },
              },
              "& p": {
                "&:not(:first-child)": {
                  "marginBlockStart": "1em",
                },
              },
              "maxWidth": "800px",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mb_1em:not(:first-child) {
          margin-block-end: 1em
              }

        .max-w_800px {
          max-width: 800px
          }

        .\\\\[\\\\&_p\\\\]\\\\:\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mt_1em p:not(:first-child) {
          margin-block-start: 1em
                  }

        .\\\\[\\\\&_h1\\\\]\\\\:\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mb_1em h1:not(:first-child),.\\\\[\\\\&_h2\\\\]\\\\:\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mb_1em h2:not(:first-child) {
          margin-block-end: 1em
                  }
      }"
    `)
  })

  test('should evaluate variants supplied a function', () => {
    const code = `
    import {cva} from ".panda/css"
    const variants = () => {
      const spacingTokens = Object.entries({
          s: 'token(spacing.1)',
          m: 'token(spacing.2)',
          l: 'token(spacing.3)',
      });

      const spacingProps = {
          'px': 'paddingX',
          'py': 'paddingY',
      };

      // Generate variants programmatically
      return Object.entries(spacingProps)
          .map(([name, styleProp]) => {
              const variants = spacingTokens
                  .map(([variant, token]) => ({ [variant]: { [styleProp]: token } }))
                  .reduce((_agg, kv) => ({ ..._agg, ...kv }));

              return { [name]: variants };
          })
          .reduce((_agg, kv) => ({ ..._agg, ...kv }));
    }
    const baseStyle = cva({
        variants: variants(),
    })
     `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "variants": {
                "px": {
                  "l": {
                    "paddingX": "token(spacing.3)",
                  },
                  "m": {
                    "paddingX": "token(spacing.2)",
                  },
                  "s": {
                    "paddingX": "token(spacing.1)",
                  },
                },
                "py": {
                  "l": {
                    "paddingY": "token(spacing.3)",
                  },
                  "m": {
                    "paddingY": "token(spacing.2)",
                  },
                  "s": {
                    "paddingY": "token(spacing.1)",
                  },
                },
              },
            },
          ],
          "name": "cva",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .px_token\\\\(spacing\\\\.1\\\\) {
          padding-inline: var(--spacing-1)
          }

        .px_token\\\\(spacing\\\\.2\\\\) {
          padding-inline: var(--spacing-2)
          }

        .px_token\\\\(spacing\\\\.3\\\\) {
          padding-inline: var(--spacing-3)
          }

        .py_token\\\\(spacing\\\\.1\\\\) {
          padding-block: var(--spacing-1)
          }

        .py_token\\\\(spacing\\\\.2\\\\) {
          padding-block: var(--spacing-2)
          }

        .py_token\\\\(spacing\\\\.3\\\\) {
          padding-block: var(--spacing-3)
          }
      }"
    `)
  })

  test('import map', () => {
    const code = `
    import { css } from "controlled-import-map/css";
    import { buttonStyle } from "controlled-import-map/common";
    import { stack } from "controlled-import-map/common";
    import { Box } from "controlled-import-map";

    css({ mx: '3' })
    stack({ direction: "column" })
    buttonStyle({ visual: "funky" })

    const App = () => {
      return (
        <>
          <Box color="red" />
        </>
      );
    }
     `
    const result = run(code, {
      outdir: 'anywhere',
      importMap: {
        css: 'controlled-import-map/css',
        recipes: 'controlled-import-map/common',
        patterns: 'controlled-import-map/common',
        jsx: 'controlled-import-map',
      },
    })
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "mx": "3",
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
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
              "color": "red",
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .mx_3 {
          margin-inline: var(--spacing-3)
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

        .text_red {
          color: red
          }
      }

      @layer recipes {
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
          color: var(--colors-black)
              }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue
              }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center
              }
          }
      }"
    `)
  })

  test('array syntax - simple', () => {
    const code = `
        import { Box } from ".panda/jsx"

         function App() {
           return (
            <Box paddingLeft={[0]} />
          )
         }
       `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "paddingLeft": [
                0,
              ],
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pl_0 {
          padding-left: var(--spacing-0)
          }
      }"
    `)
  })

  test('array syntax - simple conditional', () => {
    const code = `
        import { Box } from ".panda/jsx"

         function App() {
           return (
            <Box paddingLeft={hasIcon ? [0] : [4]} />
          )
         }
       `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "paddingLeft": [
                0,
              ],
            },
            {
              "paddingLeft": [
                4,
              ],
            },
            {},
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pl_0 {
          padding-left: var(--spacing-0)
          }

        .pl_4 {
          padding-left: var(--spacing-4)
          }
      }"
    `)
  })

  test('array syntax - conditional in middle', () => {
    const code = `
        import { Box } from ".panda/jsx"

         function App() {
           return (
            <Box py={[2, verticallyCondensed ? 2 : 3, 4]} />
          )
         }
       `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "py": [
                undefined,
                2,
              ],
            },
            {
              "py": [
                undefined,
                3,
              ],
            },
            {
              "py": [
                2,
                undefined,
                4,
              ],
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .py_2 {
          padding-block: var(--spacing-2)
          }

        @media screen and (min-width: 40em) {
          .sm\\\\:py_2 {
            padding-block: var(--spacing-2)
          }

          .sm\\\\:py_3 {
            padding-block: var(--spacing-3)
          }
              }

        @media screen and (min-width: 48em) {
          .md\\\\:py_4 {
            padding-block: var(--spacing-4)
          }
              }
      }"
    `)
  })

  test('styled FactoryOptions defaultProps extraction', () => {
    const code = `
    import { panda } from ".panda/jsx"
    import { cva } from ".panda/css"
    import { button as aliasedButton } from ".panda/recipes"

    const Button = panda("button", aliasedButton, {
      defaultProps: {
        size: 'md',
        variant: 'second',
        color: {
          base: "amber.400",
          _dark: "sky.300"
          _hover: {
            base: "amber.500",
            _dark: "sky.200"
          }
        },
      }
    })

    export default function Page() {
      return (
        <>
          <Button>Click me!</Button>
        </>
      )
    }

     `
    const result = run(code, {
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'button',
              jsx: ['Button'],
              base: {
                color: 'sky.100',
                bg: 'red.900',
              },
              variants: {
                size: {
                  sm: { borderRadius: 'sm' },
                  md: { borderRadius: 'md' },
                },
                variant: {
                  first: { backgroundColor: 'blue.500' },
                  second: { backgroundColor: 'red.500' },
                },
              },
              defaultVariants: { size: 'sm' },
            },
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
          "name": "panda",
          "type": "object",
        },
        {
          "data": [
            {
              "color": {
                "_dark": "sky.300",
                "_hover": {
                  "_dark": "sky.200",
                  "base": "amber.500",
                },
                "base": "amber.400",
              },
              "size": "md",
              "variant": "second",
            },
          ],
          "name": "button",
          "type": "jsx-recipe",
        },
        {
          "data": [
            {},
          ],
          "name": "Button",
          "type": "jsx-recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_amber\\\\.400 {
          color: var(--colors-amber-400)
          }

        [data-theme=dark] .dark\\\\:text_sky\\\\.300, .dark .dark\\\\:text_sky\\\\.300, .dark\\\\:text_sky\\\\.300.dark, .dark\\\\:text_sky\\\\.300[data-theme=dark] {
          color: var(--colors-sky-300)
              }

        .hover\\\\:text_amber\\\\.500:is(:hover, [data-hover]) {
          color: var(--colors-amber-500)
              }

        [data-theme=dark] .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover]), .dark .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover]), .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover]).dark, .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover])[data-theme=dark] {
          color: var(--colors-sky-200)
                  }
      }

      @layer recipes {
        .button--size_md {
          border-radius: var(--radii-md)
          }

        .button--variant_second {
          background-color: var(--colors-red-500)
          }

        .button--size_sm {
          border-radius: var(--radii-sm)
          }

        @layer _base {
          .button {
            color: var(--colors-sky-100);
            background: var(--colors-red-900)
              }
          }
      }"
    `)
  })

  test('array syntax within config recipes', () => {
    const code = `
    import { css } from ".panda/css"
    import { card } from ".panda/recipes"

    export default function Page() {
      return (
        <>
          <div className={cx(card(), css({ fontSize: [2, 5] }))}>Click me!</div>
        </>
      )
    }

     `
    const result = run(code, {
      theme: {
        extend: {
          recipes: {
            card: {
              className: 'card',
              base: {
                color: ['blue', 'red'],
              },
              variants: {
                size: {
                  sm: {
                    borderRadius: ['sm'],
                    padding: ['2'],
                    margin: '4',
                  },
                },
              },
              defaultVariants: { size: 'sm' },
            },
          },
        },
      },
    })
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "fontSize": [
                2,
                5,
              ],
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {},
          ],
          "name": "card",
          "type": "recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_2 {
          font-size: 2px
          }

        @media screen and (min-width: 40em) {
          .sm\\\\:fs_5 {
            font-size: 5px
          }
              }
      }

      @layer recipes {
        .card--size_sm {
          border-radius: var(--radii-sm);
          padding: var(--spacing-2);
          margin: var(--spacing-4)
          }

        @layer _base {
          .card {
            color: blue;
              }

          @media screen and (min-width: 40em) {
            .card {
              color: red
                      }
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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

  test('linkOverlay, linkBox', () => {
    const code = `
      import { linkOverlay, linkBox } from ".panda/patterns"

      function Button() {
        return (
          <div className={linkBox()}>
              <a className={linkOverlay()}>Click me</a>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "linkBox",
          "type": "pattern",
        },
        {
          "data": [
            {},
          ],
          "name": "linkOverlay",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:pos_relative :where(a, abbr) {
          position: relative
              }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:z_1 :where(a, abbr) {
          z-index: 1
              }

        .pos_static {
          position: static
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:pos_absolute::before {
          position: absolute
              }

        .before\\\\:cursor_inherit::before {
          cursor: inherit
              }

        .before\\\\:inset_0::before {
          inset: var(--spacing-0)
              }

        .before\\\\:z_0::before {
          z-index: 0
              }
      }"
    `)
  })

  test('jsx linkOverlay, linkBox', () => {
    const code = `
      import { LinkBox, LinkOverlay } from ".panda/jsx"

      function Button() {
        return (
          <LinkBox>
              <LinkOverlay>Click me</LinkOverlay>
          </LinkBox>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "LinkBox",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {},
          ],
          "name": "LinkOverlay",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:pos_relative :where(a, abbr) {
          position: relative
              }

        .\\\\[\\\\&_\\\\:where\\\\(a\\\\,_abbr\\\\)\\\\]\\\\:z_1 :where(a, abbr) {
          z-index: 1
              }

        .pos_static {
          position: static
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:pos_absolute::before {
          position: absolute
              }

        .before\\\\:cursor_inherit::before {
          cursor: inherit
              }

        .before\\\\:inset_0::before {
          inset: var(--spacing-0)
              }

        .before\\\\:z_0::before {
          z-index: 0
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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

  test('float', () => {
    const code = `
      import { float } from ".panda/patterns"

      function Button() {
        return (
          <div>
              <div className={float()}>Click me</div>
          </div>
        )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "float",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_inline-flex {
          display: inline-flex
          }

        .justify_center {
          justify-content: center
          }

        .items_center {
          align-items: center
          }

        .pos_absolute {
          position: absolute
          }

        .inset-t_0 {
          inset-block-start: var(--spacing-0)
          }

        .inset-b_auto {
          inset-block-end: auto
          }

        .start_auto {
          inset-inline-start: auto
          }

        .end_0 {
          inset-inline-end: var(--spacing-0)
          }

        .translate_50\\\\%_-50\\\\% {
          translate: 50% -50%
          }
      }"
    `)
  })

  test('jsx absoluteCenter', () => {
    const code = `
      import { Float } from ".panda/jsx"

      function Button() {
        return (
          <div>
              <Float color="blue.100">Click me</div>
          </div>
          )
      }
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "blue.100",
            },
          ],
          "name": "Float",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .d_inline-flex {
          display: inline-flex
          }

        .justify_center {
          justify-content: center
          }

        .items_center {
          align-items: center
          }

        .pos_absolute {
          position: absolute
          }

        .inset-t_0 {
          inset-block-start: var(--spacing-0)
          }

        .inset-b_auto {
          inset-block-end: auto
          }

        .start_auto {
          inset-inline-start: auto
          }

        .end_0 {
          inset-inline-end: var(--spacing-0)
          }

        .translate_50\\\\%_-50\\\\% {
          translate: 50% -50%
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot('""')
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .max-w_8xl {
          max-width: var(--sizes-8xl)
          }

        .mx_auto {
          margin-inline: auto
          }

        .px_4 {
          padding-inline: var(--spacing-4)
          }

        @media screen and (min-width: 48em) {
          .md\\\\:px_6 {
            padding-inline: var(--spacing-6)
          }
              }

        @media screen and (min-width: 64em) {
          .lg\\\\:px_8 {
            padding-inline: var(--spacing-8)
          }
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .max-w_8xl {
          max-width: var(--sizes-8xl)
          }

        .mx_auto {
          margin-inline: auto
          }

        .px_4 {
          padding-inline: var(--spacing-4)
          }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100)
          }

        @media screen and (min-width: 48em) {
          .md\\\\:px_6 {
            padding-inline: var(--spacing-6)
          }
              }

        @media screen and (min-width: 64em) {
          .lg\\\\:px_8 {
            padding-inline: var(--spacing-8)
          }
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:h_0::before {
          height: var(--sizes-0)
              }

        .before\\\\:pb_75\\\\%::before {
          padding-bottom: 75%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:d_flex>* {
          display: flex
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:justify_center>* {
          justify-content: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:items_center>* {
          align-items: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:overflow_hidden>* {
          overflow: hidden
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:pos_absolute>* {
          position: absolute
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:inset_0>* {
          inset: var(--spacing-0)
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:w_100\\\\%>* {
          width: 100%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:h_100\\\\%>* {
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
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
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

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative
          }

        .before\\\\:content_\\\\\\"\\\\\\"::before {
          content: \\"\\"
              }

        .before\\\\:d_block::before {
          display: block
              }

        .before\\\\:h_0::before {
          height: var(--sizes-0)
              }

        .before\\\\:pb_75\\\\%::before {
          padding-bottom: 75%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:d_flex>* {
          display: flex
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:justify_center>* {
          justify-content: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:items_center>* {
          align-items: center
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:overflow_hidden>* {
          overflow: hidden
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:pos_absolute>* {
          position: absolute
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:inset_0>* {
          inset: var(--spacing-0)
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:w_100\\\\%>* {
          width: 100%
              }

        .\\\\[\\\\&\\\\>\\\\*\\\\]\\\\:h_100\\\\%>* {
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

  test('nested outdir + tsconfig.compilerOptions.baseUrl importMap behaviour', () => {
    const code = `
    import { css } from "../styled-system/css";
    import { container } from "../styled-system/patterns";

    export default function App() {
      return (
        <div
          className={container({
            page: "A4",
            width: {
              _print: "210mm",
            },
            height: {
              _print: "297mm",
              base: "600px",
            },
            display: "flex",
            margin: "auto",
            flexDir: {
              _print: "row",
              base: "column",
              sm: "row",
            },
          })}
        >
          <div className={css({ flex: 2 })}>aaa</div>
          <div className={css({ flex: 1 })}>bbb</div>
        </div>
      );
    }

     `
    const result = run(code, { outdir: 'src/styled-system', cwd: 'app' }, { compilerOptions: { baseUrl: 'app/src' } })
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "flex": 2,
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "flex": 1,
            },
          ],
          "name": "css",
          "type": "object",
        },
        {
          "data": [
            {
              "display": "flex",
              "flexDir": {
                "_print": "row",
                "base": "column",
                "sm": "row",
              },
              "height": {
                "_print": "297mm",
                "base": "600px",
              },
              "margin": "auto",
              "page": "A4",
              "width": {
                "_print": "210mm",
              },
            },
          ],
          "name": "container",
          "type": "pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .flex_2 {
          flex: 2
          }

        .flex_1 {
          flex: 1 1 0%
          }

        .pos_relative {
          position: relative
          }

        .max-w_8xl {
          max-width: var(--sizes-8xl)
          }

        .mx_auto {
          margin-inline: auto
          }

        .px_4 {
          padding-inline: var(--spacing-4)
          }

        .page_A4 {
          page: A4
          }

        .h_600px {
          height: 600px
          }

        .d_flex {
          display: flex
          }

        .m_auto {
          margin: auto
          }

        .flex_column {
          flex-direction: column
          }

        @media screen and (min-width: 40em) {
          .sm\\\\:flex_row {
            flex-direction: row
          }
              }

        @media screen and (min-width: 48em) {
          .md\\\\:px_6 {
            padding-inline: var(--spacing-6)
          }
              }

        @media screen and (min-width: 64em) {
          .lg\\\\:px_8 {
            padding-inline: var(--spacing-8)
          }
              }

        @media print {
          .print\\\\:w_210mm {
            width: 210mm
          }

          .print\\\\:h_297mm {
            height: 297mm
          }

          .print\\\\:flex_row {
            flex-direction: row
          }
              }
      }"
    `)
  })

  test('{fn}.raw', () => {
    const code = `
    import { css } from ".panda/css";
    import { buttonStyle } from ".panda/recipes";
    import { stack } from ".panda/patterns";

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
    const result = run(code)
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
      "@layer utilities {
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

        .flex_row {
          flex-direction: row
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
      }

      @layer recipes {
        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem
          }

        .buttonStyle--size_sm {
          height: 2.5rem;
          min-width: 2.5rem;
          padding: 0 0.5rem
          }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
          }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black)
              }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue
              }

        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center
              }
          }
      }"
    `)
  })
})
