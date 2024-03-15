import type { Config, Preset } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { getResolvedConfig } from '../src'
import { PANDA_CONFIG_NAME } from '@pandacss/shared'

const defineConfig = <T extends Config>(config: T) => Object.assign(config, { name: PANDA_CONFIG_NAME })
const definePreset = <T extends Preset>(preset: T) => preset

describe('mergeConfigs / presets', () => {
  test('Recursively merge all presets into a single config', async () => {
    const userConfig = defineConfig({
      presets: [
        definePreset({
          name: 'preset-1',
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
        }),
        definePreset({
          name: 'preset-2',
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
        }),
        definePreset({
          name: 'preset-3',
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
        }),
        (async () => {
          const boxPromise = Promise.resolve({
            className: 'box',
            variants: {
              size: {
                lg: { p: 0 },
              },
            },
          })

          const box = await boxPromise
          return definePreset({
            name: 'preset-4-async',
            theme: {
              extend: {
                recipes: {
                  box,
                },
              },
            },
          })
        })(),
      ],
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
        "name": "__panda.config__",
        "presets": [
          {
            "name": "preset-1",
            "theme": {
              "extend": {
                "recipes": {
                  "checkbox": {
                    "className": "checkbox",
                    "variants": {
                      "default": {},
                    },
                  },
                },
              },
              "recipes": {
                "button": {
                  "className": "button",
                  "variants": {
                    "size": {
                      "small": {
                        "fontSize": "sm",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            "name": "preset-2",
            "theme": {
              "extend": {
                "recipes": {
                  "button": {
                    "className": "button",
                    "variants": {
                      "kind": {
                        "error": {
                          "backgroundColor": "red",
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
            },
          },
          {
            "name": "preset-3",
            "theme": {
              "extend": {
                "recipes": {
                  "button": {
                    "className": "button",
                    "variants": {
                      "kind": {
                        "info": {
                          "backgroundColor": "blue.300",
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
                },
              },
            },
          },
          {
            "name": "preset-4-async",
            "theme": {
              "extend": {
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
                },
              },
            },
          },
        ],
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
