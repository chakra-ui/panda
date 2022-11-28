import { semanticTokens, tokens } from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { describe, expect, test } from 'vitest'
import { Utility } from '../src/utility'

describe('Utility', () => {
  test('should prime cache for faster lookup', () => {
    const utility = new Utility({
      tokens: new TokenDictionary({ tokens, semanticTokens }),
      config: {
        backgroundColor: {
          className: 'bg',
          values: 'colors',
        },
        display: {
          className: 'd',
          values: ['flex', 'inline-flex'],
        },
        margin: {
          className: 'm',
          values: (tokens) => tokens('spacing'),
        },
        marginX: {
          className: 'mx',
          transform(value) {
            return { marginTop: value, marginBottom: value }
          },
          values: { sm: '20px', md: '40px' },
        },
        bt: {
          transform(value, token) {
            return {
              borderTopWidth: value,
              borderTopStyle: 'solid',
              borderTopColor: token('colors.gray.500'),
            }
          },
        },
      },
    })

    expect(utility.types).toMatchInlineSnapshot(`
      Map {
        "backgroundColor" => Set {
          "current",
          "gray.50",
          "gray.100",
          "gray.200",
          "gray.300",
          "gray.400",
          "gray.500",
          "gray.600",
          "gray.700",
          "gray.800",
          "gray.900",
          "green.50",
          "green.100",
          "green.200",
          "green.300",
          "green.400",
          "green.500",
          "green.600",
          "green.700",
          "green.800",
          "green.900",
          "red.50",
          "red.100",
          "red.200",
          "red.300",
          "red.400",
          "red.500",
          "red.600",
          "red.700",
          "red.800",
          "red.900",
          "primary",
          "secondary",
          "complex",
          "surface",
          "colorPalette.50",
          "colorPalette.100",
          "colorPalette.200",
          "colorPalette.300",
          "colorPalette.400",
          "colorPalette.500",
          "colorPalette.600",
          "colorPalette.700",
          "colorPalette.800",
          "colorPalette.900",
        },
        "display" => Set {
          "flex",
          "inline-flex",
        },
        "margin" => Set {
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "0.5",
          "1.5",
          "2.5",
          "3.5",
          "gutter",
          "-1",
          "-2",
          "-3",
          "-4",
          "-5",
          "-6",
          "-0.5",
          "-1.5",
          "-2.5",
          "-3.5",
          "-gutter",
        },
        "marginX" => Set {
          "sm",
          "md",
        },
        "colorPalette" => Set {
          "gray",
          "green",
          "red",
        },
      }
    `)

    expect(utility.classNames).toMatchInlineSnapshot(`
      Map {
        "(backgroundColor = current)" => "bg_current",
        "(backgroundColor = gray.50)" => "bg_gray.50",
        "(backgroundColor = gray.100)" => "bg_gray.100",
        "(backgroundColor = gray.200)" => "bg_gray.200",
        "(backgroundColor = gray.300)" => "bg_gray.300",
        "(backgroundColor = gray.400)" => "bg_gray.400",
        "(backgroundColor = gray.500)" => "bg_gray.500",
        "(backgroundColor = gray.600)" => "bg_gray.600",
        "(backgroundColor = gray.700)" => "bg_gray.700",
        "(backgroundColor = gray.800)" => "bg_gray.800",
        "(backgroundColor = gray.900)" => "bg_gray.900",
        "(backgroundColor = green.50)" => "bg_green.50",
        "(backgroundColor = green.100)" => "bg_green.100",
        "(backgroundColor = green.200)" => "bg_green.200",
        "(backgroundColor = green.300)" => "bg_green.300",
        "(backgroundColor = green.400)" => "bg_green.400",
        "(backgroundColor = green.500)" => "bg_green.500",
        "(backgroundColor = green.600)" => "bg_green.600",
        "(backgroundColor = green.700)" => "bg_green.700",
        "(backgroundColor = green.800)" => "bg_green.800",
        "(backgroundColor = green.900)" => "bg_green.900",
        "(backgroundColor = red.50)" => "bg_red.50",
        "(backgroundColor = red.100)" => "bg_red.100",
        "(backgroundColor = red.200)" => "bg_red.200",
        "(backgroundColor = red.300)" => "bg_red.300",
        "(backgroundColor = red.400)" => "bg_red.400",
        "(backgroundColor = red.500)" => "bg_red.500",
        "(backgroundColor = red.600)" => "bg_red.600",
        "(backgroundColor = red.700)" => "bg_red.700",
        "(backgroundColor = red.800)" => "bg_red.800",
        "(backgroundColor = red.900)" => "bg_red.900",
        "(backgroundColor = primary)" => "bg_primary",
        "(backgroundColor = secondary)" => "bg_secondary",
        "(backgroundColor = complex)" => "bg_complex",
        "(backgroundColor = surface)" => "bg_surface",
        "(backgroundColor = colorPalette.50)" => "bg_colorPalette.50",
        "(backgroundColor = colorPalette.100)" => "bg_colorPalette.100",
        "(backgroundColor = colorPalette.200)" => "bg_colorPalette.200",
        "(backgroundColor = colorPalette.300)" => "bg_colorPalette.300",
        "(backgroundColor = colorPalette.400)" => "bg_colorPalette.400",
        "(backgroundColor = colorPalette.500)" => "bg_colorPalette.500",
        "(backgroundColor = colorPalette.600)" => "bg_colorPalette.600",
        "(backgroundColor = colorPalette.700)" => "bg_colorPalette.700",
        "(backgroundColor = colorPalette.800)" => "bg_colorPalette.800",
        "(backgroundColor = colorPalette.900)" => "bg_colorPalette.900",
        "(display = flex)" => "d_flex",
        "(display = inline-flex)" => "d_inline-flex",
        "(margin = 1)" => "m_1",
        "(margin = 2)" => "m_2",
        "(margin = 3)" => "m_3",
        "(margin = 4)" => "m_4",
        "(margin = 5)" => "m_5",
        "(margin = 6)" => "m_6",
        "(margin = 0.5)" => "m_0.5",
        "(margin = 1.5)" => "m_1.5",
        "(margin = 2.5)" => "m_2.5",
        "(margin = 3.5)" => "m_3.5",
        "(margin = gutter)" => "m_gutter",
        "(margin = -1)" => "m_-1",
        "(margin = -2)" => "m_-2",
        "(margin = -3)" => "m_-3",
        "(margin = -4)" => "m_-4",
        "(margin = -5)" => "m_-5",
        "(margin = -6)" => "m_-6",
        "(margin = -0.5)" => "m_-0.5",
        "(margin = -1.5)" => "m_-1.5",
        "(margin = -2.5)" => "m_-2.5",
        "(margin = -3.5)" => "m_-3.5",
        "(margin = -gutter)" => "m_-gutter",
        "(marginX = sm)" => "mx_sm",
        "(marginX = md)" => "mx_md",
        "(colorPalette = gray)" => "colorPalette_gray",
        "(colorPalette = green)" => "colorPalette_green",
        "(colorPalette = red)" => "colorPalette_red",
      }
    `)

    expect(utility.styles).toMatchInlineSnapshot(`
      Map {
        "(backgroundColor = current)" => {
          "backgroundColor": "var(--colors-current)",
        },
        "(backgroundColor = gray.50)" => {
          "backgroundColor": "var(--colors-gray-50)",
        },
        "(backgroundColor = gray.100)" => {
          "backgroundColor": "var(--colors-gray-100)",
        },
        "(backgroundColor = gray.200)" => {
          "backgroundColor": "var(--colors-gray-200)",
        },
        "(backgroundColor = gray.300)" => {
          "backgroundColor": "var(--colors-gray-300)",
        },
        "(backgroundColor = gray.400)" => {
          "backgroundColor": "var(--colors-gray-400)",
        },
        "(backgroundColor = gray.500)" => {
          "backgroundColor": "var(--colors-gray-500)",
        },
        "(backgroundColor = gray.600)" => {
          "backgroundColor": "var(--colors-gray-600)",
        },
        "(backgroundColor = gray.700)" => {
          "backgroundColor": "var(--colors-gray-700)",
        },
        "(backgroundColor = gray.800)" => {
          "backgroundColor": "var(--colors-gray-800)",
        },
        "(backgroundColor = gray.900)" => {
          "backgroundColor": "var(--colors-gray-900)",
        },
        "(backgroundColor = green.50)" => {
          "backgroundColor": "var(--colors-green-50)",
        },
        "(backgroundColor = green.100)" => {
          "backgroundColor": "var(--colors-green-100)",
        },
        "(backgroundColor = green.200)" => {
          "backgroundColor": "var(--colors-green-200)",
        },
        "(backgroundColor = green.300)" => {
          "backgroundColor": "var(--colors-green-300)",
        },
        "(backgroundColor = green.400)" => {
          "backgroundColor": "var(--colors-green-400)",
        },
        "(backgroundColor = green.500)" => {
          "backgroundColor": "var(--colors-green-500)",
        },
        "(backgroundColor = green.600)" => {
          "backgroundColor": "var(--colors-green-600)",
        },
        "(backgroundColor = green.700)" => {
          "backgroundColor": "var(--colors-green-700)",
        },
        "(backgroundColor = green.800)" => {
          "backgroundColor": "var(--colors-green-800)",
        },
        "(backgroundColor = green.900)" => {
          "backgroundColor": "var(--colors-green-900)",
        },
        "(backgroundColor = red.50)" => {
          "backgroundColor": "var(--colors-red-50)",
        },
        "(backgroundColor = red.100)" => {
          "backgroundColor": "var(--colors-red-100)",
        },
        "(backgroundColor = red.200)" => {
          "backgroundColor": "var(--colors-red-200)",
        },
        "(backgroundColor = red.300)" => {
          "backgroundColor": "var(--colors-red-300)",
        },
        "(backgroundColor = red.400)" => {
          "backgroundColor": "var(--colors-red-400)",
        },
        "(backgroundColor = red.500)" => {
          "backgroundColor": "var(--colors-red-500)",
        },
        "(backgroundColor = red.600)" => {
          "backgroundColor": "var(--colors-red-600)",
        },
        "(backgroundColor = red.700)" => {
          "backgroundColor": "var(--colors-red-700)",
        },
        "(backgroundColor = red.800)" => {
          "backgroundColor": "var(--colors-red-800)",
        },
        "(backgroundColor = red.900)" => {
          "backgroundColor": "var(--colors-red-900)",
        },
        "(backgroundColor = primary)" => {
          "backgroundColor": "var(--colors-primary)",
        },
        "(backgroundColor = secondary)" => {
          "backgroundColor": "var(--colors-secondary)",
        },
        "(backgroundColor = complex)" => {
          "backgroundColor": "var(--colors-complex)",
        },
        "(backgroundColor = surface)" => {
          "backgroundColor": "var(--colors-surface)",
        },
        "(backgroundColor = colorPalette.50)" => {
          "backgroundColor": "var(--colors-color-palette-50)",
        },
        "(backgroundColor = colorPalette.100)" => {
          "backgroundColor": "var(--colors-color-palette-100)",
        },
        "(backgroundColor = colorPalette.200)" => {
          "backgroundColor": "var(--colors-color-palette-200)",
        },
        "(backgroundColor = colorPalette.300)" => {
          "backgroundColor": "var(--colors-color-palette-300)",
        },
        "(backgroundColor = colorPalette.400)" => {
          "backgroundColor": "var(--colors-color-palette-400)",
        },
        "(backgroundColor = colorPalette.500)" => {
          "backgroundColor": "var(--colors-color-palette-500)",
        },
        "(backgroundColor = colorPalette.600)" => {
          "backgroundColor": "var(--colors-color-palette-600)",
        },
        "(backgroundColor = colorPalette.700)" => {
          "backgroundColor": "var(--colors-color-palette-700)",
        },
        "(backgroundColor = colorPalette.800)" => {
          "backgroundColor": "var(--colors-color-palette-800)",
        },
        "(backgroundColor = colorPalette.900)" => {
          "backgroundColor": "var(--colors-color-palette-900)",
        },
        "(display = flex)" => {
          "display": "flex",
        },
        "(display = inline-flex)" => {
          "display": "inline-flex",
        },
        "(margin = 1)" => {
          "margin": "var(--spacing-1)",
        },
        "(margin = 2)" => {
          "margin": "var(--spacing-2)",
        },
        "(margin = 3)" => {
          "margin": "var(--spacing-3)",
        },
        "(margin = 4)" => {
          "margin": "var(--spacing-4)",
        },
        "(margin = 5)" => {
          "margin": "var(--spacing-5)",
        },
        "(margin = 6)" => {
          "margin": "var(--spacing-6)",
        },
        "(margin = 0.5)" => {
          "margin": "var(--spacing-0\\\\.5)",
        },
        "(margin = 1.5)" => {
          "margin": "var(--spacing-1\\\\.5)",
        },
        "(margin = 2.5)" => {
          "margin": "var(--spacing-2\\\\.5)",
        },
        "(margin = 3.5)" => {
          "margin": "var(--spacing-3\\\\.5)",
        },
        "(margin = gutter)" => {
          "margin": "var(--spacing-gutter)",
        },
        "(margin = -1)" => {
          "margin": "calc(var(--spacing-1) * -1)",
        },
        "(margin = -2)" => {
          "margin": "calc(var(--spacing-2) * -1)",
        },
        "(margin = -3)" => {
          "margin": "calc(var(--spacing-3) * -1)",
        },
        "(margin = -4)" => {
          "margin": "calc(var(--spacing-4) * -1)",
        },
        "(margin = -5)" => {
          "margin": "calc(var(--spacing-5) * -1)",
        },
        "(margin = -6)" => {
          "margin": "calc(var(--spacing-6) * -1)",
        },
        "(margin = -0.5)" => {
          "margin": "calc(var(--spacing-0\\\\.5) * -1)",
        },
        "(margin = -1.5)" => {
          "margin": "calc(var(--spacing-1\\\\.5) * -1)",
        },
        "(margin = -2.5)" => {
          "margin": "calc(var(--spacing-2\\\\.5) * -1)",
        },
        "(margin = -3.5)" => {
          "margin": "calc(var(--spacing-3\\\\.5) * -1)",
        },
        "(margin = -gutter)" => {
          "margin": "calc(var(--spacing-gutter) * -1)",
        },
        "(marginX = sm)" => {
          "marginBottom": "20px",
          "marginTop": "20px",
        },
        "(marginX = md)" => {
          "marginBottom": "40px",
          "marginTop": "40px",
        },
        "(colorPalette = gray)" => {
          "--colors-color-palette-100": "var(--colors-gray-100)",
          "--colors-color-palette-200": "var(--colors-gray-200)",
          "--colors-color-palette-300": "var(--colors-gray-300)",
          "--colors-color-palette-400": "var(--colors-gray-400)",
          "--colors-color-palette-50": "var(--colors-gray-50)",
          "--colors-color-palette-500": "var(--colors-gray-500)",
          "--colors-color-palette-600": "var(--colors-gray-600)",
          "--colors-color-palette-700": "var(--colors-gray-700)",
          "--colors-color-palette-800": "var(--colors-gray-800)",
          "--colors-color-palette-900": "var(--colors-gray-900)",
        },
        "(colorPalette = green)" => {
          "--colors-color-palette-100": "var(--colors-green-100)",
          "--colors-color-palette-200": "var(--colors-green-200)",
          "--colors-color-palette-300": "var(--colors-green-300)",
          "--colors-color-palette-400": "var(--colors-green-400)",
          "--colors-color-palette-50": "var(--colors-green-50)",
          "--colors-color-palette-500": "var(--colors-green-500)",
          "--colors-color-palette-600": "var(--colors-green-600)",
          "--colors-color-palette-700": "var(--colors-green-700)",
          "--colors-color-palette-800": "var(--colors-green-800)",
          "--colors-color-palette-900": "var(--colors-green-900)",
        },
        "(colorPalette = red)" => {
          "--colors-color-palette-100": "var(--colors-red-100)",
          "--colors-color-palette-200": "var(--colors-red-200)",
          "--colors-color-palette-300": "var(--colors-red-300)",
          "--colors-color-palette-400": "var(--colors-red-400)",
          "--colors-color-palette-50": "var(--colors-red-50)",
          "--colors-color-palette-500": "var(--colors-red-500)",
          "--colors-color-palette-600": "var(--colors-red-600)",
          "--colors-color-palette-700": "var(--colors-red-700)",
          "--colors-color-palette-800": "var(--colors-red-800)",
          "--colors-color-palette-900": "var(--colors-red-900)",
        },
      }
    `)

    expect(utility.transform('bt', '4px')).toMatchInlineSnapshot(`
      {
        "className": "bt_4px",
        "styles": {
          "borderTopColor": "var(--colors-gray-500)",
          "borderTopStyle": "solid",
          "borderTopWidth": "4px",
        },
      }
    `)
  })

  test('should resolve arbitrary property', () => {
    const values = { auto: 'auto', sm: '20px', md: '40px' }
    const utility = new Utility({
      tokens: new TokenDictionary({ tokens, semanticTokens }),
      config: {
        marginLeft: {
          className: 'ml',
          values,
          transform(value) {
            return { marginLeft: value }
          },
        },
        marginRight: {
          className: 'mr',
          values,
          transform(value) {
            return { marginRight: value }
          },
        },
      },
    })

    expect(utility.styles).toMatchInlineSnapshot(`
      Map {
        "(marginLeft = auto)" => {
          "marginLeft": "auto",
        },
        "(marginLeft = sm)" => {
          "marginLeft": "20px",
        },
        "(marginLeft = md)" => {
          "marginLeft": "40px",
        },
        "(marginRight = auto)" => {
          "marginRight": "auto",
        },
        "(marginRight = sm)" => {
          "marginRight": "20px",
        },
        "(marginRight = md)" => {
          "marginRight": "40px",
        },
        "(colorPalette = gray)" => {
          "--colors-color-palette-100": "var(--colors-gray-100)",
          "--colors-color-palette-200": "var(--colors-gray-200)",
          "--colors-color-palette-300": "var(--colors-gray-300)",
          "--colors-color-palette-400": "var(--colors-gray-400)",
          "--colors-color-palette-50": "var(--colors-gray-50)",
          "--colors-color-palette-500": "var(--colors-gray-500)",
          "--colors-color-palette-600": "var(--colors-gray-600)",
          "--colors-color-palette-700": "var(--colors-gray-700)",
          "--colors-color-palette-800": "var(--colors-gray-800)",
          "--colors-color-palette-900": "var(--colors-gray-900)",
        },
        "(colorPalette = green)" => {
          "--colors-color-palette-100": "var(--colors-green-100)",
          "--colors-color-palette-200": "var(--colors-green-200)",
          "--colors-color-palette-300": "var(--colors-green-300)",
          "--colors-color-palette-400": "var(--colors-green-400)",
          "--colors-color-palette-50": "var(--colors-green-50)",
          "--colors-color-palette-500": "var(--colors-green-500)",
          "--colors-color-palette-600": "var(--colors-green-600)",
          "--colors-color-palette-700": "var(--colors-green-700)",
          "--colors-color-palette-800": "var(--colors-green-800)",
          "--colors-color-palette-900": "var(--colors-green-900)",
        },
        "(colorPalette = red)" => {
          "--colors-color-palette-100": "var(--colors-red-100)",
          "--colors-color-palette-200": "var(--colors-red-200)",
          "--colors-color-palette-300": "var(--colors-red-300)",
          "--colors-color-palette-400": "var(--colors-red-400)",
          "--colors-color-palette-50": "var(--colors-red-50)",
          "--colors-color-palette-500": "var(--colors-red-500)",
          "--colors-color-palette-600": "var(--colors-red-600)",
          "--colors-color-palette-700": "var(--colors-red-700)",
          "--colors-color-palette-800": "var(--colors-red-800)",
          "--colors-color-palette-900": "var(--colors-red-900)",
        },
      }
    `)

    expect(utility.classNames).toMatchInlineSnapshot(`
      Map {
        "(marginLeft = auto)" => "ml_auto",
        "(marginLeft = sm)" => "ml_sm",
        "(marginLeft = md)" => "ml_md",
        "(marginRight = auto)" => "mr_auto",
        "(marginRight = sm)" => "mr_sm",
        "(marginRight = md)" => "mr_md",
        "(colorPalette = gray)" => "colorPalette_gray",
        "(colorPalette = green)" => "colorPalette_green",
        "(colorPalette = red)" => "colorPalette_red",
      }
    `)

    expect(utility.transform('marginLeft', 'sm')).toMatchInlineSnapshot(`
      {
        "className": "ml_sm",
        "styles": {
          "marginLeft": "20px",
        },
      }
    `)

    expect(utility.transform('marginLeft', '40px')).toMatchInlineSnapshot(`
      {
        "className": "ml_40px",
        "styles": {
          "marginLeft": "40px",
        },
      }
    `)

    expect(utility.customValues).toMatchInlineSnapshot(`
      Map {
        "marginLeft" => "40px",
      }
    `)
  })
})
