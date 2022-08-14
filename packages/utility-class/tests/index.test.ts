import { describe, expect, test } from 'vitest'
import { CSSUtilityMap } from '../src'
import { semanticTokens, tokens } from '@css-panda/fixture'
import { Dictionary } from '@css-panda/dictionary'

const dict = new Dictionary({ tokens, semanticTokens })

describe('utilty class', () => {
  test('should work', () => {
    const css = new CSSUtilityMap(
      {
        properties: {
          backgroundColor: { className: 'bg', values: 'colors' },
          margin: {
            className: 'text',
            values: (tokens) => tokens('spacing'),
          },
          marginX: {
            className: 'mx',
            values: {
              sm: {
                marginTop: '10px',
                marginBottom: '10px',
              },
            },
          },
        },
      },
      dict,
    )

    expect(css.propertyMap).toMatchInlineSnapshot(`
      Map {
        "backgroundColor_current" => {
          "className": "bg-current",
          "styles": {
            "backgroundColor": "var(--colors-current)",
          },
        },
        "backgroundColor_gray.50" => {
          "className": "bg-gray.50",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.50)",
          },
        },
        "backgroundColor_gray.100" => {
          "className": "bg-gray.100",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.100)",
          },
        },
        "backgroundColor_gray.200" => {
          "className": "bg-gray.200",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.200)",
          },
        },
        "backgroundColor_gray.300" => {
          "className": "bg-gray.300",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.300)",
          },
        },
        "backgroundColor_gray.400" => {
          "className": "bg-gray.400",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.400)",
          },
        },
        "backgroundColor_gray.500" => {
          "className": "bg-gray.500",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.500)",
          },
        },
        "backgroundColor_gray.600" => {
          "className": "bg-gray.600",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.600)",
          },
        },
        "backgroundColor_gray.700" => {
          "className": "bg-gray.700",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.700)",
          },
        },
        "backgroundColor_gray.800" => {
          "className": "bg-gray.800",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.800)",
          },
        },
        "backgroundColor_gray.900" => {
          "className": "bg-gray.900",
          "styles": {
            "backgroundColor": "var(--colors-gray\\\\.900)",
          },
        },
        "backgroundColor_green.50" => {
          "className": "bg-green.50",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.50)",
          },
        },
        "backgroundColor_green.100" => {
          "className": "bg-green.100",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.100)",
          },
        },
        "backgroundColor_green.200" => {
          "className": "bg-green.200",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.200)",
          },
        },
        "backgroundColor_green.300" => {
          "className": "bg-green.300",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.300)",
          },
        },
        "backgroundColor_green.400" => {
          "className": "bg-green.400",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.400)",
          },
        },
        "backgroundColor_green.500" => {
          "className": "bg-green.500",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.500)",
          },
        },
        "backgroundColor_green.600" => {
          "className": "bg-green.600",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.600)",
          },
        },
        "backgroundColor_green.700" => {
          "className": "bg-green.700",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.700)",
          },
        },
        "backgroundColor_green.800" => {
          "className": "bg-green.800",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.800)",
          },
        },
        "backgroundColor_green.900" => {
          "className": "bg-green.900",
          "styles": {
            "backgroundColor": "var(--colors-green\\\\.900)",
          },
        },
        "backgroundColor_red.50" => {
          "className": "bg-red.50",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.50)",
          },
        },
        "backgroundColor_red.100" => {
          "className": "bg-red.100",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.100)",
          },
        },
        "backgroundColor_red.200" => {
          "className": "bg-red.200",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.200)",
          },
        },
        "backgroundColor_red.300" => {
          "className": "bg-red.300",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.300)",
          },
        },
        "backgroundColor_red.400" => {
          "className": "bg-red.400",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.400)",
          },
        },
        "backgroundColor_red.500" => {
          "className": "bg-red.500",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.500)",
          },
        },
        "backgroundColor_red.600" => {
          "className": "bg-red.600",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.600)",
          },
        },
        "backgroundColor_red.700" => {
          "className": "bg-red.700",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.700)",
          },
        },
        "backgroundColor_red.800" => {
          "className": "bg-red.800",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.800)",
          },
        },
        "backgroundColor_red.900" => {
          "className": "bg-red.900",
          "styles": {
            "backgroundColor": "var(--colors-red\\\\.900)",
          },
        },
        "backgroundColor_primary" => {
          "className": "bg-primary",
          "styles": {
            "backgroundColor": "var(--colors-primary)",
          },
        },
        "backgroundColor_secondary" => {
          "className": "bg-secondary",
          "styles": {
            "backgroundColor": "var(--colors-secondary)",
          },
        },
        "margin_1" => {
          "className": "text-1",
          "styles": {
            "margin": "var(--spacing-1)",
          },
        },
        "margin_2" => {
          "className": "text-2",
          "styles": {
            "margin": "var(--spacing-2)",
          },
        },
        "margin_3" => {
          "className": "text-3",
          "styles": {
            "margin": "var(--spacing-3)",
          },
        },
        "margin_4" => {
          "className": "text-4",
          "styles": {
            "margin": "var(--spacing-4)",
          },
        },
        "margin_5" => {
          "className": "text-5",
          "styles": {
            "margin": "var(--spacing-5)",
          },
        },
        "margin_6" => {
          "className": "text-6",
          "styles": {
            "margin": "var(--spacing-6)",
          },
        },
        "margin_-1" => {
          "className": "text--1",
          "styles": {
            "margin": "calc(var(--spacing-1) * -1)",
          },
        },
        "margin_-2" => {
          "className": "text--2",
          "styles": {
            "margin": "calc(var(--spacing-2) * -1)",
          },
        },
        "margin_-3" => {
          "className": "text--3",
          "styles": {
            "margin": "calc(var(--spacing-3) * -1)",
          },
        },
        "margin_-4" => {
          "className": "text--4",
          "styles": {
            "margin": "calc(var(--spacing-4) * -1)",
          },
        },
        "margin_-5" => {
          "className": "text--5",
          "styles": {
            "margin": "calc(var(--spacing-5) * -1)",
          },
        },
        "margin_-6" => {
          "className": "text--6",
          "styles": {
            "margin": "calc(var(--spacing-6) * -1)",
          },
        },
        "margin_0.5" => {
          "className": "text-0.5",
          "styles": {
            "margin": "var(--spacing-0\\\\.5)",
          },
        },
        "margin_-0.5" => {
          "className": "text--0.5",
          "styles": {
            "margin": "calc(var(--spacing-0\\\\.5) * -1)",
          },
        },
        "margin_1.5" => {
          "className": "text-1.5",
          "styles": {
            "margin": "var(--spacing-1\\\\.5)",
          },
        },
        "margin_-1.5" => {
          "className": "text--1.5",
          "styles": {
            "margin": "calc(var(--spacing-1\\\\.5) * -1)",
          },
        },
        "margin_2.5" => {
          "className": "text-2.5",
          "styles": {
            "margin": "var(--spacing-2\\\\.5)",
          },
        },
        "margin_-2.5" => {
          "className": "text--2.5",
          "styles": {
            "margin": "calc(var(--spacing-2\\\\.5) * -1)",
          },
        },
        "margin_3.5" => {
          "className": "text-3.5",
          "styles": {
            "margin": "var(--spacing-3\\\\.5)",
          },
        },
        "margin_-3.5" => {
          "className": "text--3.5",
          "styles": {
            "margin": "calc(var(--spacing-3\\\\.5) * -1)",
          },
        },
        "margin_gutter" => {
          "className": "text-gutter",
          "styles": {
            "margin": "var(--spacing-gutter)",
          },
        },
        "margin_-gutter" => {
          "className": "text--gutter",
          "styles": {
            "margin": "calc(var(--spacing-gutter) * -1)",
          },
        },
        "marginX_sm" => {
          "className": "mx-sm",
          "styles": {
            "marginBottom": "10px",
            "marginTop": "10px",
          },
        },
      }
    `)
  })
})
