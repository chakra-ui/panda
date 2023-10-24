import { describe, test, expect } from 'vitest'
import { run } from './fixture'

describe('extract to css output pipeline', () => {
  test('css kitchen sink', () => {
    const code = `
      import { styled } from "styled-system/jsx"
      import { css } from "styled-system/css"

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
              <styled.div
                debug
                p="2"
                md={{
                  color,
                  _dark: { _hover: { m: -2 } }
                }}
                m={{
                  base: "1px",
                  sm: "4px",
                }}
                css={{
                  md: { p: 4 },
                  _hover: { color: "#2ecc71", backgroundColor: "var(--some-bg)" }
                }}>Click me</styled.div>
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
                "base": "1px",
                "sm": "4px",
              },
              "md": {
                "_dark": {
                  "_hover": {
                    "m": -2,
                  },
                },
                "color": "red.100",
              },
              "p": "2",
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .pos_relative {
          position: relative;
        }

        .inset_0 {
          inset: var(--spacing-0);
        }

        .text_blue\\\\.100 {
          color: var(--colors-blue-100);
        }

        .bg-img_url\\\\(\\\\\\"https\\\\:\\\\/\\\\/raw\\\\.githubusercontent\\\\.com\\\\/chakra-ui\\\\/chakra-ui\\\\/main\\\\/media\\\\/logo-colored\\\\@2x\\\\.png\\\\?raw\\\\=true\\\\\\"\\\\) {
          background-image: url(\\"https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/media/logo-colored@2x.png?raw=true\\");
        }

        .border_1px_solid_token\\\\(colors\\\\.yellow\\\\.100\\\\) {
          border: 1px solid var(--colors-yellow-100);
        }

        .--shadow_colors\\\\.orange\\\\.100 {
          --shadow: var(--colors-orange-100);
        }

        .shadow_0_0_0_4px_var\\\\(--shadow\\\\) {
          box-shadow: 0 0 0 4px var(--shadow);
        }

        .ring_var\\\\(--colors-pink-200\\\\) {
          outline-color: var(--colors-pink-200);
        }

        .debug_true {
          outline: 1px solid #00f !important;
        }

        .debug_true > * {
          outline: 1px solid red !important;
        }

        .p_2 {
          padding: var(--spacing-2);
        }

        .m_1px {
          margin: 1px;
        }

        [data-theme=\\"dark\\"] .dark\\\\:--shadow_colors\\\\.gray\\\\.800, .dark .dark\\\\:--shadow_colors\\\\.gray\\\\.800, .dark\\\\:--shadow_colors\\\\.gray\\\\.800.dark, .dark\\\\:--shadow_colors\\\\.gray\\\\.800[data-theme=\\"dark\\"] {
          --shadow: var(--colors-gray-800);
        }

        .hover\\\\:text_\\\\#2ecc71:is(:hover, [data-hover]) {
          color: #2ecc71;
        }

        .hover\\\\:bg_var\\\\(--some-bg\\\\):is(:hover, [data-hover]) {
          background-color: var(--some-bg);
        }

        @media screen and (width >= 40em) {
          .sm\\\\:m_4px {
            margin: 4px;
          }
        }

        @media screen and (width >= 48em) {
          .md\\\\:p_4 {
            padding: var(--spacing-4);
          }

          .md\\\\:text_red\\\\.100 {
            color: var(--colors-red-100);
          }

          [data-theme=\\"dark\\"] .md\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover]), .dark .md\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover]), .md\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover]).dark, .md\\\\:dark\\\\:hover\\\\:m_-2:is(:hover, [data-hover])[data-theme=\\"dark\\"] {
            margin: calc(var(--spacing-2) * -1);
          }
        }
      }
      "
    `)
  })

  test('minimal usage', () => {
    const code = `
      import { css } from "styled-system/css"

      css({ mx: '3', paddingTop: '4' })
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
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .mx_3 {
          margin-inline: var(--spacing-3);
        }

        .pt_4 {
          padding-top: var(--spacing-4);
        }
      }
      "
    `)
  })

  test('basic usage with multiple style objects', () => {
    const code = `
      import { css } from "styled-system/css"

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
          margin-inline: var(--spacing-3);
        }

        .pt_4 {
          padding-top: var(--spacing-4);
        }

        .mx_10 {
          margin-inline: var(--spacing-10);
        }

        .pt_6 {
          padding-top: var(--spacing-6);
        }
      }
      "
    `)
  })

  test('simple recipe', () => {
    const code = `
    import { sizeRecipe } from "styled-system/recipes"

    export default function Page() {
      return (
        <div className={sizeRecipe({ size: "medium" })} />
      )
    }
     `
    const result = run(code, {
      theme: {
        extend: {
          recipes: {
            sizeRecipe: {
              className: 'sizeRecipe',
              base: {
                p: 0,
                m: 2,
                _hover: {
                  base: { fontWeight: 'bold', _dark: { border: 0 } },
                  color: 'red',
                  xl: {
                    color: 'blue',
                  },
                },
              },
              variants: {
                size: {
                  medium: { fontSize: 'md', lineHeight: '1.5rem' },
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
              "size": "medium",
            },
          ],
          "name": "sizeRecipe",
          "type": "recipe",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .sizeRecipe {
            padding: var(--spacing-0);
            margin: var(--spacing-2);
          }

          .sizeRecipe:is(:hover, [data-hover]) {
            font-weight: var(--font-weights-bold);
            color: red;
          }

          [data-theme=\\"dark\\"] .sizeRecipe:is(:hover, [data-hover]), .dark .sizeRecipe:is(:hover, [data-hover]), .sizeRecipe:is(:hover, [data-hover]).dark, .sizeRecipe:is(:hover, [data-hover])[data-theme=\\"dark\\"] {
            border: 0;
          }

          @media screen and (width >= 80em) {
            .sizeRecipe:is(:hover, [data-hover]) {
              color: #00f;
            }
          }
        }

        .sizeRecipe--size_medium {
          font-size: var(--font-sizes-md);
          line-height: 1.5rem;
        }
      }
      "
    `)
  })

  test('simple utility', () => {
    const code = `
    import { css } from "styled-system/css"

    export default function Page() {
      return (
        <div className={css({ truncate: true, _hover: { sm: { truncate: true }} })} />
      )
    }
     `
    const result = run(code, {
      theme: {
        extend: {
          recipes: {
            sizeRecipe: {
              className: 'sizeRecipe',
              base: {
                p: 0,
                m: 2,
                _hover: {
                  base: { fontWeight: 'bold', _dark: { border: 0 } },
                  color: 'red',
                  xl: {
                    color: 'blue',
                  },
                },
              },
              variants: {
                size: {
                  medium: { fontSize: 'md', lineHeight: '1.5rem' },
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
                "sm": {
                  "truncate": true,
                },
              },
              "truncate": true,
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .truncate_true {
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }

        @media screen and (width >= 40em) {
          .hover\\\\:sm\\\\:truncate_true:is(:hover, [data-hover]) {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }
        }
      }
      "
    `)
  })

  test('multiple recipes on 1 component', () => {
    const code = `
    import { button, pinkRecipe, greenRecipe, blueRecipe, sizeRecipe, bgRecipe } from "styled-system/recipes"

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
            {},
          ],
          "name": "greenRecipe",
          "type": "recipe",
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
            {},
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
        @layer _base {
          .pinkRecipe {
            color: var(--colors-pink-100);
          }

          .greenRecipe {
            color: var(--colors-green-100);
          }

          .blueRecipe {
            color: var(--colors-blue-100);
          }
        }

        .pinkRecipe--variant_small, .greenRecipe--variant_small, .blueRecipe--variant_small {
          font-size: var(--font-sizes-sm);
        }

        .sizeRecipe--size_medium {
          font-size: var(--font-sizes-md);
        }

        .bgRecipe--color_yellow {
          background-color: var(--colors-yellow-100);
        }
      }

      @layer utilities {
        .text_yellow {
          color: #ff0;
        }
      }
      "
    `)
  })

  test('multiple recipes on 1 component using {recipe}.raw', () => {
    const code = `
    import { button, pinkRecipe, sizeRecipe, bgRecipe } from "styled-system/recipes"

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
            {
              "size": "medium",
            },
          ],
          "name": "sizeRecipe",
          "type": "recipe",
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .pinkRecipe {
            color: var(--colors-pink-100);
          }
        }

        .pinkRecipe--variant_small {
          font-size: var(--font-sizes-sm);
        }

        .sizeRecipe--size_medium {
          font-size: var(--font-sizes-md);
        }

        .bgRecipe--color_yellow {
          background-color: var(--colors-yellow-100);
        }
      }
      "
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

    expect(result.css).toMatchInlineSnapshot(`
      "
      "
    `)
  })

  test('string literal - factory', () => {
    const code = `
    import { styled } from "styled-system/jsx"

    const Example = styled('span')\`
      color: lightgreen;

      & > strong {
        color: hotpink;
      }
    \`

    const baseStyle = styled.div\`
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
    const result = run(code, { syntax: 'template-literal' })
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
          "name": "styled",
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
          "name": "styled.div",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_lightgreen {
          color: #90ee90;
        }

        .background_transparent {
          background: none;
        }

        .border-radius_3px {
          border-radius: 3px;
        }

        .border_1px_solid_var\\\\(--accent-color\\\\) {
          border: 1px solid var(--accent-color);
        }

        .color_token\\\\(colors\\\\.blue\\\\.100\\\\) {
          color: var(--colors-blue-100);
        }

        .display_inline-block {
          display: inline-block;
        }

        .margin_0\\\\.5rem_1rem {
          margin: .5rem 1rem;
        }

        .padding_0\\\\.5rem_0 {
          padding: .5rem 0;
        }

        .transition_all_200ms_ease-in-out {
          transition: all .2s ease-in-out;
        }

        .width_11rem {
          width: 11rem;
        }

        .\\\\[\\\\&_\\\\>_strong\\\\]\\\\:color_hotpink > strong {
          color: #ff69b4;
        }

        .\\\\[\\\\&\\\\:hover\\\\]\\\\:filter_brightness\\\\(0\\\\.85\\\\):hover {
          filter: brightness(.85);
        }

        .\\\\[\\\\&\\\\:hover\\\\]\\\\:\\\\[\\\\&\\\\:disabled\\\\]\\\\:filter_brightness\\\\(1\\\\):hover:disabled {
          filter: brightness();
        }

        @media (width >= 768px) {
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:padding_1rem_0 {
            padding: 1rem 0;
          }

          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:disabled\\\\]\\\\:filter_brightness\\\\(1\\\\):disabled {
            filter: brightness();
          }
        }
      }
      "
    `)
  })

  test('string literal - css', () => {
    const code = `
    import { css } from "styled-system/css"

    const className = css\`
        background: transparent;
        border-radius: 3px;
        border: 1px solid var(--accent-color);
        color: token(colors.blue.100);
    \`
     `
    const result = run(code, { syntax: 'template-literal' })
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
        .background_transparent {
          background: none;
        }

        .border-radius_3px {
          border-radius: 3px;
        }

        .border_1px_solid_var\\\\(--accent-color\\\\) {
          border: 1px solid var(--accent-color);
        }

        .color_token\\\\(colors\\\\.blue\\\\.100\\\\) {
          color: var(--colors-blue-100);
        }
      }
      "
    `)
  })

  test('runtime conditions', () => {
    const code = `
      import { css } from "styled-system/css"

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
          color: var(--colors-blue-100);
        }

        .text_red\\\\.100 {
          color: var(--colors-red-100);
        }
      }
      "
    `)
  })

  test('arbitrary selectors', () => {
    const code = `
      import { css } from "styled-system/css"

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
          color: var(--colors-green-100);
        }

        .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:m_-2px + .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:m_-2px {
          margin: -2px;
        }

        .\\\\[\\\\&\\\\[data-state\\\\=\\\\'open\\\\'\\\\]\\\\]\\\\:cursor_pointer[data-state=\\"open\\"] {
          cursor: pointer;
        }

        .closed > [data-theme=\\"dark\\"] .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900, .closed > .dark .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900, .closed > .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900.dark, .closed > .\\\\[\\\\.closed_\\\\>_\\\\&\\\\]\\\\:dark\\\\:text_green\\\\.900[data-theme=\\"dark\\"] {
          color: var(--colors-green-900);
        }

        .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:hover\\\\:m_0 + .\\\\[\\\\&_\\\\+_\\\\&\\\\]\\\\:hover\\\\:m_0:is(:hover, [data-hover]) {
          margin: var(--spacing-0);
        }

        .\\\\[\\\\&\\\\[data-state\\\\=\\\\'open\\\\'\\\\]\\\\]\\\\:before\\\\:content_\\\\\\"👋\\\\\\"[data-state=\\"open\\"]:before {
          content: \\"👋\\";
        }
      }
      "
    `)
  })

  test('colorPalette', () => {
    const code = `
      import { css } from "styled-system/css"

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
          --colors-color-palette-950: var(--colors-blue-950);
        }

        .bg_colorPalette\\\\.100 {
          background: var(--colors-color-palette-100);
        }

        .hover\\\\:text_colorPalette\\\\.300:is(:hover, [data-hover]) {
          color: var(--colors-color-palette-300);
        }
      }
      "
    `)
  })

  // https://github.com/chakra-ui/panda/issues/1062
  describe('issue 1062: expand colorPalette flexibility', () => {
    test('should extract color palette with more than one level of nesting', () => {
      const code = `
      import { css } from "styled-system/css"

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
            --colors-color-palette-light-accent-secondary: var(--colors-button-light-accent-secondary);
          }

          .text_colorPalette\\\\.light {
            color: var(--colors-color-palette-light);
          }

          .bg_colorPalette\\\\.dark {
            background-color: var(--colors-color-palette-dark);
          }

          .color-palette_button\\\\.light {
            --colors-color-palette-accent: var(--colors-button-light-accent);
            --colors-color-palette-accent-secondary: var(--colors-button-light-accent-secondary);
          }

          .text_colorPalette\\\\.accent {
            color: var(--colors-color-palette-accent);
          }

          .bg_colorPalette\\\\.accent\\\\.secondary {
            background: var(--colors-color-palette-accent-secondary);
          }

          .color-palette_button\\\\.light\\\\.accent {
            --colors-color-palette-secondary: var(--colors-button-light-accent-secondary);
          }

          .text_colorPalette\\\\.secondary {
            color: var(--colors-color-palette-secondary);
          }

          .hover\\\\:text_colorPalette\\\\.light\\\\.accent:is(:hover, [data-hover]) {
            color: var(--colors-color-palette-light-accent);
          }

          .hover\\\\:bg_colorPalette\\\\.light\\\\.accent\\\\.secondary:is(:hover, [data-hover]) {
            background: var(--colors-color-palette-light-accent-secondary);
          }
        }
        "
      `)
    })
  })

  test('patterns', () => {
    const code = `
      import { stack, hstack as aliased } from "styled-system/patterns"

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
        .d_flex {
          display: flex;
        }

        .flex_column {
          flex-direction: column;
        }

        .items_center {
          align-items: center;
        }

        .gap_10px {
          gap: 10px;
        }

        .justify_flex-end {
          justify-content: flex-end;
        }

        .flex_row {
          flex-direction: row;
        }
      }
      "
    `)
  })

  test('jsx patterns + custom wrapper', () => {
    const code = `
      import { stack } from "styled-system/patterns"

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
        .d_flex {
          display: flex;
        }

        .flex_column {
          flex-direction: column;
        }

        .items_center {
          align-items: center;
        }

        .gap_10px {
          gap: 10px;
        }

        .items_flex-end {
          align-items: flex-end;
        }
      }
      "
    `)
  })

  test('factory css', () => {
    const code = `
    import { styled } from "styled-system/jsx"

    // PropertyAccess factory css
    styled.div({
      color: "red.100",
    })

    // CallExpression factory css
    styled("div", {
        color: "yellow.100",
    })

    // TaggedTemplateExpression factory css
    styled.div\`
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
          "name": "styled.div",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "var(--colors-purple-100)",
            },
          ],
          "name": "styled.div",
          "type": "object",
        },
        {
          "data": [
            {
              "color": "yellow.100",
            },
          ],
          "name": "styled",
          "type": "object",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_red\\\\.100 {
          color: var(--colors-red-100);
        }

        .text_var\\\\(--colors-purple-100\\\\) {
          color: var(--colors-purple-100);
        }

        .text_yellow\\\\.100 {
          color: var(--colors-yellow-100);
        }
      }
      "
    `)
  })

  test('cva and factory recipes', () => {
    const code = `
      import { styled } from "styled-system/jsx"
      import { cva } from "styled-system/css"

      // PropertyAccess factory inline recipe
      styled.div({
        base: {
          color: "blue.100",
        },
        variants: {
          //
        }
      })

      // CallExpression factory inline recipe
      styled("div", {
        base: {
          color: "green.100",
        },
        variants: {
          //
        }
      })

      // PropertyAccess factory + cva
      styled.div(cva({
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
            {
              "base": {
                "color": "blue.100",
              },
              "variants": {},
            },
          ],
          "name": "styled.div",
          "type": "cva",
        },
        {
          "data": [
            {},
          ],
          "name": "styled.div",
          "type": "object",
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
          "name": "styled",
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
          color: var(--colors-blue-100);
        }

        .text_green\\\\.100 {
          color: var(--colors-green-100);
        }

        .text_rose\\\\.100 {
          color: var(--colors-rose-100);
        }

        .text_sky\\\\.100 {
          color: var(--colors-sky-100);
        }

        .bg_red\\\\.900 {
          background: var(--colors-red-900);
        }
      }
      "
    `)
  })

  test('should extract config recipes', () => {
    const code = `
       import { styled, Stack } from "styled-system/jsx"
      import { button, anotherButton, complexButton } from "styled-system/recipes"

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
                    <styled.button marginTop="40px" marginBottom="42px">Click me</styled.button>
                    <styled.div bg="red.200">Click me</styled.div>
                    <AnotherButtonWithRegex variant="danger" size="md" />
                    <AnotherButton spacing="sm" />
                    <ComplexDesignSystemButton color="blue" />
                </Stack>
            </div>
        )
       }
     `
    const result = run(code, {
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
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {},
          ],
          "name": "button",
          "type": "recipe",
        },
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
          "name": "anotherButton",
          "type": "recipe",
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
          "name": "styled.button",
          "type": "jsx-factory",
        },
        {
          "data": [
            {
              "bg": "red.200",
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
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
            {
              "color": "blue",
            },
          ],
          "name": "ComplexDesignSystemButton",
          "type": "jsx-recipe",
        },
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .button {
            font-size: var(--font-sizes-lg);
          }
        }

        .button--size_md {
          padding: var(--spacing-4);
          border-radius: var(--radii-md);
        }

        .button--variant_danger {
          color: var(--colors-white);
          background-color: var(--colors-red-500);
        }

        .anotherButton--spacing_sm {
          padding: var(--spacing-2);
          border-radius: var(--radii-sm);
        }

        .complexButton--color_blue {
          color: var(--colors-blue-500);
        }
      }

      @layer utilities {
        .z_100 {
          z-index: 100;
        }

        .d_flex {
          display: flex;
        }

        .flex_column {
          flex-direction: column;
        }

        .gap_10px {
          gap: 10px;
        }

        .mt_40px {
          margin-top: 40px;
        }

        .mb_42px {
          margin-bottom: 42px;
        }

        .bg_red\\\\.200 {
          background: var(--colors-red-200);
        }
      }
      "
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
    const result = run(code, {
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
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "base": {
                "padding": "md",
              },
            },
          ],
          "name": "styled",
          "type": "cva",
        },
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
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_md {
          padding: md;
        }

        .bg_tomato {
          background-color: tomato;
        }

        .bg_yellow {
          background-color: #ff0;
        }

        .text_pink {
          color: pink;
        }

        .text_purple {
          color: purple;
        }
      }
      "
    `)
  })

  test('styled inline cva with invalid values', () => {
    const code = `
    import { styled } from 'styled-system/jsx';
    const StyledButton = styled('button', { base: { padding: 'md', textStyle: 'heading.something' } });
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "base": {
                "padding": "md",
                "textStyle": "heading.something",
              },
            },
          ],
          "name": "styled",
          "type": "cva",
        },
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_md {
          padding: md;
        }
      }
      "
    `)
  })

  test('cva compound variants', () => {
    const code = `
    import { cva } from 'styled-system/css';

    const btn = cva({
      variants: {
        variant: {
          primary: { color: "white" }
        },
      },
      compoundVariants: [
        {
          variant: 'primary',
          css: {
            bg: 'red.900',
          },
        },
      ],
    })
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "compoundVariants": [
                {
                  "css": {
                    "bg": "red.900",
                  },
                  "variant": "primary",
                },
              ],
              "variants": {
                "variant": {
                  "primary": {
                    "color": "white",
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
        .text_white {
          color: var(--colors-white);
        }

        .bg_red\\\\.900 {
          background: var(--colors-red-900);
        }
      }
      "
    `)
  })

  test('sva compound variants', () => {
    const code = `
    import { sva } from 'styled-system/css';

    const btn = sva({
      slots: ['root', 'label'],
      variants: {
        variant: {
          primary: {
            root: { fontSize: "sm" },
            label: { fontSize: "md" },
          }
        },
      },
      compoundVariants: [
        {
          variant: 'primary',
          css: {
            root: {
              bg: 'red.900',
            },
          },
        },
      ],
    })
     `
    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "compoundVariants": [
                {
                  "css": {
                    "root": {
                      "bg": "red.900",
                    },
                  },
                  "variant": "primary",
                },
              ],
              "slots": [
                "root",
                "label",
              ],
              "variants": {
                "variant": {
                  "primary": {
                    "label": {
                      "fontSize": "md",
                    },
                    "root": {
                      "fontSize": "sm",
                    },
                  },
                },
              },
            },
          ],
          "name": "sva",
          "type": "object",
        },
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_sm {
          font-size: var(--font-sizes-sm);
        }

        .bg_red\\\\.900 {
          background: var(--colors-red-900);
        }

        .fs_md {
          font-size: var(--font-sizes-md);
        }
      }
      "
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
        .max-w_800px {
          max-width: 800px;
        }

        .\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mb_1em:not(:first-child) {
          margin-block-end: 1em;
        }

        .\\\\[\\\\&_p\\\\]\\\\:\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mt_1em p:not(:first-child) {
          margin-block-start: 1em;
        }

        .\\\\[\\\\&_h1\\\\]\\\\:\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mb_1em h1:not(:first-child), .\\\\[\\\\&_h2\\\\]\\\\:\\\\[\\\\&\\\\:not\\\\(\\\\:first-child\\\\)\\\\]\\\\:mb_1em h2:not(:first-child) {
          margin-block-end: 1em;
        }
      }
      "
    `)
  })

  test('should evaluate variants supplied a function', () => {
    const code = `
    import {cva} from "styled-system/css"
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
          padding-inline: var(--spacing-1);
        }

        .px_token\\\\(spacing\\\\.2\\\\) {
          padding-inline: var(--spacing-2);
        }

        .px_token\\\\(spacing\\\\.3\\\\) {
          padding-inline: var(--spacing-3);
        }

        .py_token\\\\(spacing\\\\.1\\\\) {
          padding-block: var(--spacing-1);
        }

        .py_token\\\\(spacing\\\\.2\\\\) {
          padding-block: var(--spacing-2);
        }

        .py_token\\\\(spacing\\\\.3\\\\) {
          padding-block: var(--spacing-3);
        }
      }
      "
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
              "direction": "column",
            },
          ],
          "name": "stack",
          "type": "pattern",
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
              "color": "red",
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .buttonStyle {
            justify-content: center;
            align-items: center;
            display: inline-flex;
          }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
          }
        }

        .buttonStyle--size_md {
          min-width: 3rem;
          height: 3rem;
          padding: 0 .75rem;
        }

        .buttonStyle--variant_solid {
          color: var(--colors-white);
          background-color: #00f;
        }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: #00008b;
        }

        .buttonStyle--variant_solid[data-disabled] {
          color: var(--colors-black);
          background-color: gray;
        }
      }

      @layer utilities {
        .mx_3 {
          margin-inline: var(--spacing-3);
        }

        .d_flex {
          display: flex;
        }

        .flex_column {
          flex-direction: column;
        }

        .gap_10px {
          gap: 10px;
        }

        .text_red {
          color: red;
        }
      }
      "
    `)
  })

  test('array syntax - simple', () => {
    const code = `
        import { Box } from "styled-system/jsx"

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
          padding-left: var(--spacing-0);
        }
      }
      "
    `)
  })

  test('array syntax - simple conditional', () => {
    const code = `
        import { Box } from "styled-system/jsx"

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
          padding-left: var(--spacing-0);
        }

        .pl_4 {
          padding-left: var(--spacing-4);
        }
      }
      "
    `)
  })

  test('array syntax - conditional in middle', () => {
    const code = `
        import { Box } from "styled-system/jsx"

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
          padding-block: var(--spacing-2);
        }

        @media screen and (width >= 40em) {
          .sm\\\\:py_2 {
            padding-block: var(--spacing-2);
          }

          .sm\\\\:py_3 {
            padding-block: var(--spacing-3);
          }
        }

        @media screen and (width >= 48em) {
          .md\\\\:py_4 {
            padding-block: var(--spacing-4);
          }
        }
      }
      "
    `)
  })

  test('styled FactoryOptions defaultProps extraction', () => {
    const code = `
    import { styled } from "styled-system/jsx"
    import { cva } from "styled-system/css"
    import { button as aliasedButton } from "styled-system/recipes"

    const Button = styled("button", aliasedButton, {
      defaultProps: {
        size: 'md',
        variant: 'second',
        color: {
          base: "amber.400",
          _dark: "sky.300",
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
          "name": "styled",
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
      "@layer recipes {
        @layer _base {
          .button {
            color: var(--colors-sky-100);
            background: var(--colors-red-900);
          }
        }

        .button--size_md {
          border-radius: var(--radii-md);
        }

        .button--variant_second {
          background-color: var(--colors-red-500);
        }

        .button--size_sm {
          border-radius: var(--radii-sm);
        }
      }

      @layer utilities {
        .text_amber\\\\.400 {
          color: var(--colors-amber-400);
        }

        [data-theme=\\"dark\\"] .dark\\\\:text_sky\\\\.300, .dark .dark\\\\:text_sky\\\\.300, .dark\\\\:text_sky\\\\.300.dark, .dark\\\\:text_sky\\\\.300[data-theme=\\"dark\\"] {
          color: var(--colors-sky-300);
        }

        .hover\\\\:text_amber\\\\.500:is(:hover, [data-hover]) {
          color: var(--colors-amber-500);
        }

        [data-theme=\\"dark\\"] .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover]), .dark .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover]), .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover]).dark, .hover\\\\:dark\\\\:text_sky\\\\.200:is(:hover, [data-hover])[data-theme=\\"dark\\"] {
          color: var(--colors-sky-200);
        }
      }
      "
    `)
  })

  test('simple nested condition', () => {
    const code = `
        import { styled } from "styled-system/jsx"

        <styled.div p={{ sm: { _hover: { base: 3, _dark: 4 } } }} />
       `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "p": {
                "sm": {
                  "_hover": {
                    "_dark": 4,
                    "base": 3,
                  },
                },
              },
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
        },
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (width >= 40em) {
          .sm\\\\:hover\\\\:p_3:is(:hover, [data-hover]) {
            padding: var(--spacing-3);
          }

          [data-theme=\\"dark\\"] .sm\\\\:hover\\\\:dark\\\\:p_4:is(:hover, [data-hover]), .dark .sm\\\\:hover\\\\:dark\\\\:p_4:is(:hover, [data-hover]), .sm\\\\:hover\\\\:dark\\\\:p_4:is(:hover, [data-hover]).dark, .sm\\\\:hover\\\\:dark\\\\:p_4:is(:hover, [data-hover])[data-theme=\\"dark\\"] {
            padding: var(--spacing-4);
          }
        }
      }
      "
    `)
  })

  test('shorthand + condition ', () => {
    const code = `
        import { styled } from "styled-system/jsx"

        <styled.div m={{
          base: 1,
          sm: { _hover: 2 },
          _dark: {
            _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12, } }, base: 10 },
            base: 3,
            md: 4,
            lg: { base: 5, _hover: 6 },
            _focus: [7, undefined, null, 8, 9]
            }
          }} />
       `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "m": {
                "_dark": {
                  "_disabled": {
                    "_open": {
                      "base": 11,
                      "xl": {
                        "_loading": 13,
                        "base": 12,
                      },
                    },
                    "base": 10,
                  },
                  "_focus": [
                    7,
                    undefined,
                    null,
                    8,
                    9,
                  ],
                  "base": 3,
                  "lg": {
                    "_hover": 6,
                    "base": 5,
                  },
                  "md": 4,
                },
                "base": 1,
                "sm": {
                  "_hover": 2,
                },
              },
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_1 {
          margin: var(--spacing-1);
        }

        [data-theme=\\"dark\\"] .dark\\\\:m_3, .dark .dark\\\\:m_3, .dark\\\\:m_3.dark, .dark\\\\:m_3[data-theme=\\"dark\\"] {
          margin: var(--spacing-3);
        }

        [data-theme=\\"dark\\"] .dark\\\\:disabled\\\\:m_10:is(:disabled, [disabled], [data-disabled]), .dark .dark\\\\:disabled\\\\:m_10:is(:disabled, [disabled], [data-disabled]), .dark\\\\:disabled\\\\:m_10:is(:disabled, [disabled], [data-disabled]).dark, .dark\\\\:disabled\\\\:m_10:is(:disabled, [disabled], [data-disabled])[data-theme=\\"dark\\"] {
          margin: var(--spacing-10);
        }

        [data-theme=\\"dark\\"] .dark\\\\:focus\\\\:m_7:is(:focus, [data-focus]), .dark .dark\\\\:focus\\\\:m_7:is(:focus, [data-focus]), .dark\\\\:focus\\\\:m_7:is(:focus, [data-focus]).dark, .dark\\\\:focus\\\\:m_7:is(:focus, [data-focus])[data-theme=\\"dark\\"] {
          margin: var(--spacing-7);
        }

        [data-theme=\\"dark\\"] .dark\\\\:disabled\\\\:open\\\\:m_11:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]), .dark .dark\\\\:disabled\\\\:open\\\\:m_11:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]), .dark\\\\:disabled\\\\:open\\\\:m_11:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]).dark, .dark\\\\:disabled\\\\:open\\\\:m_11:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"])[data-theme=\\"dark\\"] {
          margin: var(--spacing-11);
        }

        @media screen and (width >= 40em) {
          .sm\\\\:hover\\\\:m_2:is(:hover, [data-hover]) {
            margin: var(--spacing-2);
          }
        }

        @media screen and (width >= 48em) {
          [data-theme=\\"dark\\"] .dark\\\\:md\\\\:m_4, .dark .dark\\\\:md\\\\:m_4, .dark\\\\:md\\\\:m_4.dark, .dark\\\\:md\\\\:m_4[data-theme=\\"dark\\"] {
            margin: var(--spacing-4);
          }
        }

        @media screen and (width >= 64em) {
          [data-theme=\\"dark\\"] .dark\\\\:lg\\\\:m_5, .dark .dark\\\\:lg\\\\:m_5, .dark\\\\:lg\\\\:m_5.dark, .dark\\\\:lg\\\\:m_5[data-theme=\\"dark\\"] {
            margin: var(--spacing-5);
          }

          [data-theme=\\"dark\\"] .dark\\\\:focus\\\\:lg\\\\:m_8:is(:focus, [data-focus]), .dark .dark\\\\:focus\\\\:lg\\\\:m_8:is(:focus, [data-focus]), .dark\\\\:focus\\\\:lg\\\\:m_8:is(:focus, [data-focus]).dark, .dark\\\\:focus\\\\:lg\\\\:m_8:is(:focus, [data-focus])[data-theme=\\"dark\\"] {
            margin: var(--spacing-8);
          }

          [data-theme=\\"dark\\"] .dark\\\\:lg\\\\:hover\\\\:m_6:is(:hover, [data-hover]), .dark .dark\\\\:lg\\\\:hover\\\\:m_6:is(:hover, [data-hover]), .dark\\\\:lg\\\\:hover\\\\:m_6:is(:hover, [data-hover]).dark, .dark\\\\:lg\\\\:hover\\\\:m_6:is(:hover, [data-hover])[data-theme=\\"dark\\"] {
            margin: var(--spacing-6);
          }
        }

        @media screen and (width >= 80em) {
          [data-theme=\\"dark\\"] .dark\\\\:focus\\\\:xl\\\\:m_9:is(:focus, [data-focus]), .dark .dark\\\\:focus\\\\:xl\\\\:m_9:is(:focus, [data-focus]), .dark\\\\:focus\\\\:xl\\\\:m_9:is(:focus, [data-focus]).dark, .dark\\\\:focus\\\\:xl\\\\:m_9:is(:focus, [data-focus])[data-theme=\\"dark\\"] {
            margin: var(--spacing-9);
          }

          [data-theme=\\"dark\\"] .dark\\\\:disabled\\\\:open\\\\:xl\\\\:m_12:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]), .dark .dark\\\\:disabled\\\\:open\\\\:xl\\\\:m_12:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]), .dark\\\\:disabled\\\\:open\\\\:xl\\\\:m_12:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]).dark, .dark\\\\:disabled\\\\:open\\\\:xl\\\\:m_12:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"])[data-theme=\\"dark\\"] {
            margin: var(--spacing-12);
          }

          [data-theme=\\"dark\\"] .dark\\\\:disabled\\\\:open\\\\:xl\\\\:loading\\\\:m_13:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]):is([data-loading], [aria-busy=\\"true\\"]), .dark .dark\\\\:disabled\\\\:open\\\\:xl\\\\:loading\\\\:m_13:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]):is([data-loading], [aria-busy=\\"true\\"]), .dark\\\\:disabled\\\\:open\\\\:xl\\\\:loading\\\\:m_13:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]):is([data-loading], [aria-busy=\\"true\\"]).dark, .dark\\\\:disabled\\\\:open\\\\:xl\\\\:loading\\\\:m_13:is(:disabled, [disabled], [data-disabled]):is([open], [data-open], [data-state=\\"open\\"]):is([data-loading], [aria-busy=\\"true\\"])[data-theme=\\"dark\\"] {
            margin: 13px;
          }
        }
      }
      "
    `)
  })

  test('compositions - textStyle', () => {
    const code = `
        import { css } from "styled-system/jsx"

        <div className={css({ color: "red", textStyle: "headline.h1" })} />
       `

    const result = run(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "red",
              "textStyle": "headline.h1",
            },
          ],
          "name": "css",
          "type": "object",
        },
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        @layer compositions {
          .textStyle_headline\\\\.h1 {
            font-size: 2rem;
            font-weight: var(--font-weights-bold);
          }
        }

        .text_red {
          color: red;
        }
      }
      "
    `)
  })
})
