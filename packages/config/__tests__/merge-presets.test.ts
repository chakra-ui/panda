import type { Config } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { getResolvedConfig } from '../src'

const defineConfig = <T extends Config>(config: T) => config

describe('mergeConfigs / presets', () => {
  test('Recursively merge all presets into a single config', async () => {
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

    const someLibConfig = defineConfig({
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'button',
              variants: {
                kind: {
                  error: { backgroundColor: 'red' },
                },
              },
            },
            table: {
              className: 'table',
              variants: {
                style: {
                  striped: { backgroundColor: 'gray.300' },
                },
              },
            },
          },
        },
      },
    })

    const anotherLibConfig = defineConfig({
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'button',
              variants: {
                kind: {
                  info: { backgroundColor: 'blue.300' },
                },
              },
            },
            menu: {
              className: 'menu',
              variants: {
                size: {
                  lg: { p: 0 },
                },
              },
            },
          },
        },
      },
    })

    const asyncConfig = async () => {
      const boxPromise = Promise.resolve({
        className: 'box',
        variants: {
          size: {
            lg: { p: 0 },
          },
        },
      })

      const box = await boxPromise
      return defineConfig({
        theme: {
          extend: {
            recipes: {
              box,
            },
          },
        },
      })
    }

    const userConfig = defineConfig({
      presets: [defaultConfig, someLibConfig, anotherLibConfig, asyncConfig()],
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

    const result = await getResolvedConfig(userConfig, 'src')

    expect(result).toMatchInlineSnapshot(`
      {
        "theme": {
          "recipes": {
            "box": {
              "className": "box",
              "variants": {
                "size": {
                  "lg": {
                    "p": 0,
                  },
                },
              },
            },
            "button": {
              "className": "button",
              "variants": {
                "kind": {
                  "error": {
                    "backgroundColor": "red",
                  },
                  "info": {
                    "backgroundColor": "blue.300",
                  },
                },
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
            "menu": {
              "className": "menu",
              "variants": {
                "size": {
                  "lg": {
                    "p": 0,
                  },
                },
              },
            },
            "table": {
              "className": "table",
              "variants": {
                "style": {
                  "striped": {
                    "backgroundColor": "gray.300",
                  },
                },
              },
            },
          },
        },
      }
    `)
  })
})
