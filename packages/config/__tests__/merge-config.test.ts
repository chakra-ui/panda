import { describe, expect, test } from 'vitest'
import { mergeConfigs } from '../src/merge-config'
import { getResolvedConfig } from '../src/get-resolved-config'
import type { Config } from '@pandacss/types'

const defineConfig = <T extends Config>(config: T) => config

describe('mergeConfigs / theme', () => {
  test('should merge configs', () => {
    const result = mergeConfigs([
      defineConfig({
        theme: {
          extend: {
            tokens: {
              colors: {
                red: { value: 'red' },
              },
            },
          },
        },
      }),
      defineConfig({
        theme: {
          extend: {
            tokens: {
              colors: {
                blue: { value: 'blue' },
              },
            },
          },
        },
      }) as Config,
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "blue",
              },
              "red": {
                "value": "red",
              },
            },
          },
        },
      }
    `)
  })

  test('should merge override', () => {
    const userConfig = defineConfig({
      theme: {
        extend: {
          tokens: {
            colors: {
              blue: { value: 'blue' },
            },
          },
        },
      },
    })

    const defaultConfig = defineConfig({
      theme: {
        tokens: {
          colors: {
            red: { value: 'override' },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "blue",
              },
              "red": {
                "value": "override",
              },
            },
          },
        },
      }
    `)
  })

  test('should merge and override', () => {
    const userConfig = defineConfig({
      theme: {
        tokens: {
          colors: {
            pink: { value: 'pink' },
          },
        },
        extend: {
          tokens: {
            colors: {
              blue: { value: 'blue' },
            },
          },
        },
      },
    })

    const defaultConfig = defineConfig({
      theme: {
        tokens: {
          colors: {
            red: { value: 'override' },
          },
        },
        extend: {
          tokens: {
            colors: {
              orange: { value: 'orange' },
            },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "blue",
              },
              "orange": {
                "value": "orange",
              },
              "pink": {
                "value": "pink",
              },
            },
          },
        },
      }
    `)
  })

  test('should getResolvedConfig, merge and override', async () => {
    const defaultConfig = defineConfig({
      presets: [
        {
          theme: {
            tokens: {
              colors: {
                'nested-1': { value: 'nested-1' },
              },
            },
            extend: {
              tokens: {
                colors: {
                  'nested-X': { value: 'nested-A' },
                },
              },
            },
          },
        },
        {
          theme: {
            tokens: {
              colors: {
                'nested-2': { value: 'nested-2' },
              },
            },
            extend: {
              tokens: {
                colors: {
                  'nested-X': { value: 'nested-B' },
                },
              },
            },
          },
        },
      ],
      theme: {
        tokens: {
          colors: {
            'default-main': { value: 'override' },
          },
        },
        extend: {
          tokens: {
            colors: {
              orange: { value: 'orange-never-overriden' },
              gray: { value: 'from-default-config' },
            },
          },
        },
      },
    })

    const userConfig = defineConfig({
      presets: [
        {
          theme: {
            tokens: {
              colors: {
                'nested-3': { value: 'nested-3' },
              },
            },
            extend: {
              tokens: {
                colors: {
                  'nested-X': { value: 'nested-C' },
                },
              },
            },
          },
        },
        {
          theme: {
            tokens: {
              colors: {
                'nested-4': { value: 'nested-4' },
              },
            },
            extend: {
              tokens: {
                colors: {
                  'nested-X': { value: 'nested-D' },
                },
              },
            },
          },
        },
      ],
      theme: {
        tokens: {
          colors: {
            pink: { value: 'pink' },
            'nested-5': { value: 'nested-5' },
            'nested-X': { value: 'nested-E' },
          },
        },
        extend: {
          tokens: {
            colors: {
              blue: { value: 'blue' },
              gray: { value: 'final-gray' },
              'nested-X': { value: 'nested-F' },
            },
          },
        },
      },
    })

    const result = await getResolvedConfig(
      {
        presets: [defaultConfig, userConfig],
        theme: {
          tokens: {
            colors: {
              danger: { value: 'final-color' },
            },
          },
          extend: {
            tokens: {
              colors: {
                blue: { value: 'final-blue' },
                final: { value: 'final' },
                'nested-X': { value: 'final-nested' },
              },
            },
          },
        },
      },
      '',
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "final-blue",
              },
              "danger": {
                "value": "final-color",
              },
              "final": {
                "value": "final",
              },
              "gray": {
                "value": "final-gray",
              },
              "nested-X": {
                "value": "final-nested",
              },
              "orange": {
                "value": "orange-never-overriden",
              },
            },
          },
        },
      }
    `)
  })

  test('non-existing keys', () => {
    const userConfig = defineConfig({
      theme: {
        extend: {
          tokens: {
            colors: {
              blue: { value: 'blue' },
            },
          },
        },
      },
    })

    const defaultConfig = defineConfig({
      theme: {
        tokens: {
          fonts: {
            sans: { value: 'Lato, sans-serif' },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "blue",
              },
            },
            "fonts": {
              "sans": {
                "value": "Lato, sans-serif",
              },
            },
          },
        },
      }
    `)
  })
})

describe('mergeConfigs / utilities', () => {
  test('should merge utilities', () => {
    const userConfig = defineConfig({
      utilities: {
        extend: {
          backgroundColor: {
            className: 'bgc',
          },
        },
      },
    })

    const defaultConfig = defineConfig({
      utilities: {
        backgroundColor: {
          className: 'bg',
          values: 'colors',
        },
      },
    })

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result.utilities).toMatchInlineSnapshot(`
      {
        "backgroundColor": {
          "className": "bgc",
          "values": "colors",
        },
      }
    `)
  })
})

describe('mergeConfigs / recipes', () => {
  test('should merge utilities', () => {
    const userConfig = defineConfig({
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'button',
              variants: {
                size: {
                  large: { fontSize: 'lg' },
                },
              },
            },
            checkbox: {
              className: 'checkbox',
              variants: {
                shape: {
                  circle: { rounded: 'full' },
                },
              },
            },
          },
        },
      },
    })

    const defaultConfig = defineConfig({
      theme: {
        recipes: {
          button: {
            className: 'button',
            variants: {
              size: {
                small: {
                  fontSize: 'sm',
                },
              },
            },
          },
        },
        extend: {
          recipes: {
            checkbox: {
              className: 'checkbox',
              variants: {
                default: {},
              },
            },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result.theme.recipes).toMatchInlineSnapshot(`
      {
        "button": {
          "className": "button",
          "variants": {
            "size": {
              "large": {
                "fontSize": "lg",
              },
              "small": {
                "fontSize": "sm",
              },
            },
          },
        },
        "checkbox": {
          "className": "checkbox",
          "variants": {
            "default": {},
            "shape": {
              "circle": {
                "rounded": "full",
              },
            },
          },
        },
      }
    `)
  })
})

describe('mergeConfigs / staticCss', () => {
  test('should merge utilities', () => {
    const userConfig = defineConfig({
      staticCss: {
        extend: {
          recipes: {
            button: ['*'],
            badge: [{ variants: ['*'] }],
          },
        },
      },
    })

    const defaultConfig = defineConfig({
      staticCss: {
        recipes: {
          badge: [{ size: ['sm'] }],
          card: ['*'],
        },
      },
    })

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result.staticCss).toMatchInlineSnapshot(`
      {
        "recipes": {
          "badge": [
            {
              "size": [
                "sm",
              ],
            },
            {
              "variants": [
                "*",
              ],
            },
          ],
          "button": [
            "*",
          ],
          "card": [
            "*",
          ],
        },
      }
    `)
  })
})
