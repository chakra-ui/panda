import { PANDA_CONFIG_NAME } from '@pandacss/shared'
import type { Config, Preset } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { getResolvedConfig } from '../src/get-resolved-config'
import { mergeConfigs } from '../src/merge-config'

const defineConfig = <T extends Config>(config: T) => Object.assign(config, { name: PANDA_CONFIG_NAME })
const definePreset = <T extends Preset>(preset: T) => preset

describe('mergeConfigs / theme', () => {
  test('should merge configs', () => {
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        theme: {
          extend: {
            tokens: {
              colors: {
                red: { value: 'from-preset' },
                blue: { value: 'from-preset' },
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
                blue: { value: 'from-config' },
              },
            },
          },
        },
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "from-config",
              },
              "red": {
                "value": "from-preset",
              },
            },
          },
        },
      }
    `)
  })

  test('should merge multiple configs', () => {
    const result = mergeConfigs([
      definePreset({
        name: 'preset-1',
        theme: {
          extend: {
            tokens: {
              colors: {
                blue: { value: 'preset-1' },
                red: { value: 'preset-1' },
              },
            },
          },
        },
      }),
      definePreset({
        name: 'preset-2',
        theme: {
          extend: {
            tokens: {
              colors: {
                blue: { value: 'preset-2' },
                red: { value: 'preset-2' },
              },
            },
          },
        },
      }),
      definePreset({
        name: 'preset-3',
        theme: {
          extend: {
            tokens: {
              colors: {
                blue: { value: 'preset-3' },
                red: { value: 'preset-3' },
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
                red: { value: 'from-config' },
              },
            },
          },
        },
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "preset-3",
              },
              "red": {
                "value": "from-config",
              },
            },
          },
        },
      }
    `)
  })

  test('should merge override', () => {
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        theme: {
          extend: {
            tokens: {
              colors: {
                blue: { value: 'blue' },
              },
            },
          },
        },
      }),
      defineConfig({
        theme: {
          tokens: {
            colors: {
              red: { value: 'override' },
            },
          },
        },
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
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
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
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
      }),
      defineConfig({
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
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "blue": {
                "value": "blue",
              },
              "orange": {
                "value": "orange",
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

  test('config + preset.extend', () => {
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        theme: {
          extend: {
            tokens: {
              colors: {
                pink: { value: 'from-preset' },
              },
            },
          },
        },
      }),
      defineConfig({
        theme: {
          tokens: {
            colors: {
              pink: { value: 'from-config' },
            },
          },
        },
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "pink": {
                "value": "from-preset",
              },
            },
          },
        },
      }
    `)
  })

  test('config.extend + preset', () => {
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        theme: {
          tokens: {
            colors: {
              pink: { value: 'from-preset' },
            },
          },
        },
      }),
      defineConfig({
        theme: {
          extend: {
            tokens: {
              colors: {
                pink: { value: 'from-config' },
              },
            },
          },
        },
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "pink": {
                "value": "from-config",
              },
            },
          },
        },
      }
    `)
  })

  test('should getResolvedConfig, merge and override', async () => {
    const higherPreset1 = definePreset({
      name: 'higher-preset-1',
      presets: [
        {
          name: 'preset1',
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
          name: 'preset2',
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
              gray: { value: 'from-higher-preset-1' },
            },
          },
        },
      },
    })

    const higherPreset2 = definePreset({
      name: 'higher-preset-2',
      presets: [
        {
          name: 'preset3',
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
          name: 'preset4',
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
      defineConfig({
        presets: [higherPreset1, higherPreset2],
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
      }),
      '',
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "presets": [
          {
            "name": "preset1",
            "theme": {
              "extend": {
                "tokens": {
                  "colors": {
                    "nested-X": {
                      "value": "nested-A",
                    },
                  },
                },
              },
              "tokens": {
                "colors": {
                  "nested-1": {
                    "value": "nested-1",
                  },
                },
              },
            },
          },
          {
            "name": "preset2",
            "theme": {
              "extend": {
                "tokens": {
                  "colors": {
                    "nested-X": {
                      "value": "nested-B",
                    },
                  },
                },
              },
              "tokens": {
                "colors": {
                  "nested-2": {
                    "value": "nested-2",
                  },
                },
              },
            },
          },
          {
            "name": "higher-preset-1",
            "presets": [
              {
                "name": "preset1",
                "theme": {
                  "extend": {
                    "tokens": {
                      "colors": {
                        "nested-X": {
                          "value": "nested-A",
                        },
                      },
                    },
                  },
                  "tokens": {
                    "colors": {
                      "nested-1": {
                        "value": "nested-1",
                      },
                    },
                  },
                },
              },
              {
                "name": "preset2",
                "theme": {
                  "extend": {
                    "tokens": {
                      "colors": {
                        "nested-X": {
                          "value": "nested-B",
                        },
                      },
                    },
                  },
                  "tokens": {
                    "colors": {
                      "nested-2": {
                        "value": "nested-2",
                      },
                    },
                  },
                },
              },
            ],
            "theme": {
              "extend": {
                "tokens": {
                  "colors": {
                    "gray": {
                      "value": "from-higher-preset-1",
                    },
                    "orange": {
                      "value": "orange-never-overriden",
                    },
                  },
                },
              },
              "tokens": {
                "colors": {
                  "default-main": {
                    "value": "override",
                  },
                },
              },
            },
          },
          {
            "name": "preset3",
            "theme": {
              "extend": {
                "tokens": {
                  "colors": {
                    "nested-X": {
                      "value": "nested-C",
                    },
                  },
                },
              },
              "tokens": {
                "colors": {
                  "nested-3": {
                    "value": "nested-3",
                  },
                },
              },
            },
          },
          {
            "name": "preset4",
            "theme": {
              "extend": {
                "tokens": {
                  "colors": {
                    "nested-X": {
                      "value": "nested-D",
                    },
                  },
                },
              },
              "tokens": {
                "colors": {
                  "nested-4": {
                    "value": "nested-4",
                  },
                },
              },
            },
          },
          {
            "name": "higher-preset-2",
            "presets": [
              {
                "name": "preset3",
                "theme": {
                  "extend": {
                    "tokens": {
                      "colors": {
                        "nested-X": {
                          "value": "nested-C",
                        },
                      },
                    },
                  },
                  "tokens": {
                    "colors": {
                      "nested-3": {
                        "value": "nested-3",
                      },
                    },
                  },
                },
              },
              {
                "name": "preset4",
                "theme": {
                  "extend": {
                    "tokens": {
                      "colors": {
                        "nested-X": {
                          "value": "nested-D",
                        },
                      },
                    },
                  },
                  "tokens": {
                    "colors": {
                      "nested-4": {
                        "value": "nested-4",
                      },
                    },
                  },
                },
              },
            ],
            "theme": {
              "extend": {
                "tokens": {
                  "colors": {
                    "blue": {
                      "value": "blue",
                    },
                    "gray": {
                      "value": "final-gray",
                    },
                    "nested-X": {
                      "value": "nested-F",
                    },
                  },
                },
              },
              "tokens": {
                "colors": {
                  "nested-5": {
                    "value": "nested-5",
                  },
                  "nested-X": {
                    "value": "nested-E",
                  },
                  "pink": {
                    "value": "pink",
                  },
                },
              },
            },
          },
        ],
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
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        theme: {
          tokens: {
            fonts: {
              sans: { value: 'Lato, sans-serif' },
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
      }),
    ])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
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

  test('flat and nested object on same key', () => {
    const preset = definePreset({
      name: 'preset',
      theme: {
        extend: {
          tokens: {
            colors: {
              black: { value: 'black' },
            },
          },
        },
      },
    })

    const userConfig = defineConfig({
      theme: {
        tokens: {
          colors: {
            black: {
              0: { value: 'black' },
              10: { value: 'black/10' },
              20: { value: 'black/20' },
              30: { value: 'black/30' },
            },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, preset])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "preset",
        "theme": {
          "tokens": {
            "colors": {
              "black": {
                "0": {
                  "value": "black",
                },
                "10": {
                  "value": "black/10",
                },
                "20": {
                  "value": "black/20",
                },
                "30": {
                  "value": "black/30",
                },
                "DEFAULT": {
                  "value": "black",
                },
              },
            },
          },
        },
      }
    `)

    // opposite order
    expect(mergeConfigs([preset, userConfig])).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "black": {
                "0": {
                  "value": "black",
                },
                "10": {
                  "value": "black/10",
                },
                "20": {
                  "value": "black/20",
                },
                "30": {
                  "value": "black/30",
                },
                "DEFAULT": {
                  "value": "black",
                },
              },
            },
          },
        },
      }
    `)
  })

  test('flat and nested object with existing DEFAULT', () => {
    const preset = definePreset({
      name: 'preset',
      theme: {
        extend: {
          tokens: {
            colors: {
              black: { value: 'black' },
            },
          },
        },
      },
    })

    const userConfig = defineConfig({
      theme: {
        tokens: {
          colors: {
            black: {
              DEFAULT: { value: 'white' },
              0: { value: 'black' },
              10: { value: 'black/10' },
              20: { value: 'black/20' },
              30: { value: 'black/30' },
            },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, preset])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "preset",
        "theme": {
          "tokens": {
            "colors": {
              "black": {
                "0": {
                  "value": "black",
                },
                "10": {
                  "value": "black/10",
                },
                "20": {
                  "value": "black/20",
                },
                "30": {
                  "value": "black/30",
                },
                "DEFAULT": {
                  "value": "white",
                },
              },
            },
          },
        },
      }
    `)

    // opposite order
    expect(mergeConfigs([preset, userConfig])).toMatchInlineSnapshot(`
      {
        "name": "__panda.config__",
        "theme": {
          "tokens": {
            "colors": {
              "black": {
                "0": {
                  "value": "black",
                },
                "10": {
                  "value": "black/10",
                },
                "20": {
                  "value": "black/20",
                },
                "30": {
                  "value": "black/30",
                },
                "DEFAULT": {
                  "value": "white",
                },
              },
            },
          },
        },
      }
    `)
  })

  test('flat and nested object + deprecated', () => {
    const preset = definePreset({
      name: 'preset',
      theme: {
        extend: {
          tokens: {
            colors: {
              black: { value: 'black', deprecated: 'use white instead' },
            },
          },
        },
      },
    })

    const userConfig = defineConfig({
      theme: {
        tokens: {
          colors: {
            black: {
              30: { value: 'black/30', deprecated: true },
            },
          },
        },
      },
    })

    const result = mergeConfigs([userConfig, preset])

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "preset",
        "theme": {
          "tokens": {
            "colors": {
              "black": {
                "30": {
                  "deprecated": true,
                  "value": "black/30",
                },
                "DEFAULT": {
                  "deprecated": "use white instead",
                  "value": "black",
                },
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
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        utilities: {
          backgroundColor: {
            className: 'bg',
            values: 'colors',
          },
        },
      }),
      defineConfig({
        utilities: {
          extend: {
            backgroundColor: {
              className: 'bgc',
            },
          },
        },
      }),
    ])

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
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
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
      defineConfig({
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
      }),
    ])

    expect(result.theme?.recipes).toMatchInlineSnapshot(`
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
    const result = mergeConfigs([
      definePreset({
        name: 'preset',
        staticCss: {
          recipes: {
            badge: [{ size: ['sm'] }],
            card: ['*'],
          },
        },
      }),
      defineConfig({
        staticCss: {
          extend: {
            recipes: {
              button: ['*'],
              badge: [{ variants: ['*'] }],
            },
          },
        },
      }),
    ])

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
