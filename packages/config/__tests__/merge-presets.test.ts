import { describe, expect, test } from 'vitest'
import { getResolvedConfig } from '../src/merge-config'
import type { Config } from '@pandacss/types'

describe('mergeConfigs / presets', () => {
  test('Recursively merge all presets into a single config', async () => {
    const defaultConfig = {
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
              variants: {
                default: {},
              },
            },
          },
        },
      },
    } as Config

    const someLibConfig = {
      theme: {
        extend: {
          recipes: {
            button: {
              variants: {
                kind: {
                  error: { backgroundColor: 'red' },
                },
              },
            },
            table: {
              variants: {
                style: {
                  striped: { backgroundColor: 'gray.300' },
                },
              },
            },
          },
        },
      },
    } as Config

    const anotherLibConfig = {
      theme: {
        extend: {
          recipes: {
            button: {
              variants: {
                kind: {
                  info: { backgroundColor: 'blue.300' },
                },
              },
            },
            menu: {
              variants: {
                size: {
                  lg: { p: 0 },
                },
              },
            },
          },
        },
      },
    } as Config

    const asyncConfig = async () => {
      const boxPromise = Promise.resolve({
        variants: {
          size: {
            lg: { p: 0 },
          },
        },
      })

      const box = await boxPromise
      return {
        theme: {
          extend: {
            recipes: {
              box,
            },
          },
        },
      } as Config
    }

    const userConfig = {
      presets: [defaultConfig, someLibConfig, anotherLibConfig, asyncConfig()],
      theme: {
        extend: {
          recipes: {
            button: {
              variants: {
                size: {
                  large: { fontSize: 'lg' },
                },
              },
            },
            checkbox: {
              variants: {
                shape: {
                  circle: { rounded: 'full' },
                },
              },
            },
          },
        },
      },
    } as Config

    const result = await getResolvedConfig(userConfig, 'src')

    expect(result).toMatchInlineSnapshot(`
      {
        "conditions": {},
        "globalCss": {},
        "patterns": {},
        "presets": [],
        "theme": {
          "recipes": {
            "box": {
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
              "variants": {
                "size": {
                  "lg": {
                    "p": 0,
                  },
                },
              },
            },
            "table": {
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
        "utilities": {},
      }
    `)
  })
})
