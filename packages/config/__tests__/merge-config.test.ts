import { describe, expect, test } from 'vitest'
import { mergeConfigs } from '../src/merge-config'

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
      },
      {
        theme: {
          extend: {
            colors: {
              blue: 'blue',
            },
          },
        },
      },
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
    }

    const defaultConfig = {
      theme: {
        colors: {
          red: 'override',
        },
      },
    }

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
    }

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
    }

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
      recipes: {
        extend: {
          button: {
            variants: {
              size: {
                large: {
                  fontSize: 'lg',
                },
              },
            },
          },
        },
      },
    }

    const defaultConfig = {
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
    }

    const result = mergeConfigs([userConfig, defaultConfig])

    expect(result.recipes).toMatchInlineSnapshot(`
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
      }
    `)
  })
})
