import { describe, expect, test } from 'vitest'
import { mergeConfigs } from '../src/merge-config'
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
