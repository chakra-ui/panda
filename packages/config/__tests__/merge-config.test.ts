import { describe, expect, test } from 'vitest'
import { mergeConfigs } from '../src/merge-config'
import type { Config } from '@pandacss/types'

describe('mergeConfigs / theme', () => {
  test('should merge configs', () => {
    const result = mergeConfigs([
      {
        theme: {
          extend: {
            colors: {
              red: 'red',
            },
          },
        },
      } as Config,
      {
        theme: {
          extend: {
            colors: {
              blue: 'blue',
            },
          },
        },
      } as Config,
    ])

    expect(result).toMatchObject({
      theme: {
        colors: {
          blue: 'blue',
          red: 'red',
        },
      },
    })
  })

  test('should merge override', () => {
    const userConfig = {
      theme: {
        extend: {
          colors: {
            blue: 'blue',
          },
        },
      },
    } as Config

    const defaultConfig = {
      theme: {
        colors: {
          red: 'override',
        },
      },
    } as Config

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result).toMatchObject({
      theme: {
        colors: {
          blue: 'blue',
          red: 'override',
        },
      },
    })
  })

  test('should merge and override', () => {
    const userConfig = {
      theme: {
        colors: {
          pink: 'pink',
        },
        extend: {
          colors: {
            blue: 'blue',
          },
        },
      },
    } as Config

    const defaultConfig = {
      theme: {
        colors: {
          red: 'override',
        },
        extend: {
          colors: {
            orange: 'orange',
          },
        },
      },
    } as Config

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result).toMatchObject({
      theme: {
        colors: {
          blue: 'blue',
          orange: 'orange',
          pink: 'pink',
        },
      },
    })
  })

  test('non-existing keys', () => {
    const userConfig = {
      theme: {
        extend: {
          colors: {
            blue: 'blue',
          },
        },
      },
    } as Config

    const defaultConfig = {
      theme: {
        fonts: {
          sans: 'Lato, sans-serif',
        },
      },
    } as Config

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result).toMatchObject({
      theme: {
        fonts: {
          sans: 'Lato, sans-serif',
        },
        colors: {
          blue: 'blue',
        },
      },
    })
  })
})

describe('mergeConfigs / utilities', () => {
  test('should merge utilities', () => {
    const userConfig = {
      utilities: {
        extend: {
          backgroundColor: {
            className: 'bgc',
          },
        },
      },
    }

    const defaultConfig = {
      utilities: {
        backgroundColor: {
          className: 'bg',
          values: 'colors',
        },
      },
    }

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
    const userConfig = {
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
    }

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
    }

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result.theme.recipes).toMatchInlineSnapshot(`
      {
        "button": {
          "name": "button",
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
