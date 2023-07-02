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
            name: 'button',
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
              name: 'checkbox',
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
              name: 'button',
              variants: {
                kind: {
                  error: { backgroundColor: 'red' },
                },
              },
            },
            table: {
              name: 'table',
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
              name: 'button',
              variants: {
                kind: {
                  info: { backgroundColor: 'blue.300' },
                },
              },
            },
            menu: {
              name: 'menu',
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
        name: 'box',
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
              name: 'button',
              variants: {
                size: {
                  large: { fontSize: 'lg' },
                },
              },
            },
            checkbox: {
              name: 'checkbox',
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
              "name": "box",
              "variants": {
                "size": {
                  "lg": {
                    "p": 0,
                  },
                },
              },
            },
            "button": {
              "name": "button",
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
              "name": "checkbox",
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
              "name": "menu",
              "variants": {
                "size": {
                  "lg": {
                    "p": 0,
                  },
                },
              },
            },
            "table": {
              "name": "table",
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
