import { describe, expect, expectTypeOf, test } from 'vitest'
import { defineRecipe, type RecipeBuilder } from '../define-recipe'

describe('define-recipe', () => {
  test('identity fn', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
          },
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: { color: 'blue.100' }
          red: { color: 'red.100' }
        }
        size: {
          sm: { h: string }
          md: { h: string }
        }
      }>
    >()
  })

  test('config.merge', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    }).config.merge({
      className: 'aaa',
      variants: {
        visual: {
          green: { color: 'green.100' },
          yellow: { color: 'yellow.100' },
        },
        size: {
          lg: { h: '12' },
          xl: { h: '14' },
        },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "aaa",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "lg": {
              "h": "12",
            },
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
            "xl": {
              "h": "14",
            },
          },
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "green": {
              "color": "green.100",
            },
            "red": {
              "color": "red.100",
            },
            "yellow": {
              "color": "yellow.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: { color: 'blue.100' }
          red: { color: 'red.100' }
          green: { color: 'green.100' }
          yellow: { color: 'yellow.100' }
        }
        size: {
          sm: { h: string }
          md: { h: string }
          lg: { h: string }
          xl: { h: string }
        }
      }>
    >()
  })

  test('config.omit', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    }).config.omit('visual')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        size: {
          sm: { h: string }
          md: { h: string }
        }
      }>
    >()
  })

  test('config.omit multiple', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
        border: {
          solid: { border: '1px solid' },
          dashed: { border: '1px dashed' },
        },
      },
    }).config.omit('visual', 'size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "border": {
            "dashed": {
              "border": "1px dashed",
            },
            "solid": {
              "border": "1px solid",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        border: {
          solid: {
            border: '1px solid'
          }
          dashed: {
            border: '1px dashed'
          }
        }
      }>
    >()
  })

  test('config.pick', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    }).config.pick('visual')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: { color: 'blue.100' }
          red: { color: 'red.100' }
        }
      }>
    >()
  })

  test('config.pick multiple', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
        border: {
          solid: { border: '1px solid' },
          dashed: { border: '1px dashed' },
        },
      },
    }).config.pick('visual', 'border')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "border": {
            "dashed": {
              "border": "1px dashed",
            },
            "solid": {
              "border": "1px solid",
            },
          },
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        border: {
          solid: {
            border: '1px solid'
          }
          dashed: {
            border: '1px dashed'
          }
        }
        visual: {
          blue: { color: 'blue.100' }
          red: { color: 'red.100' }
        }
      }>
    >()
  })

  test('config.extend', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    }).config.extend({
      visual: {
        green: { color: 'green.100' },
        yellow: { color: 'yellow.100' },
      },
      size: {
        lg: { h: '12' },
        xl: { h: '14' },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "lg": {
              "h": "12",
            },
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
            "xl": {
              "h": "14",
            },
          },
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "green": {
              "color": "green.100",
            },
            "red": {
              "color": "red.100",
            },
            "yellow": {
              "color": "yellow.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: { color: 'blue.100' }
          red: { color: 'red.100' }
          green: { color: 'green.100' }
          yellow: { color: 'yellow.100' }
        }
        size: {
          sm: { h: string }
          md: { h: string }
          lg: { h: string }
          xl: { h: string }
        }
      }>
    >()
  })

  test('config.extend existing', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    }).config.extend({
      visual: {
        blue: { backgroundColor: 'blue.900' },
        yellow: { color: 'yellow.100' },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
          },
          "visual": {
            "blue": {
              "backgroundColor": "blue.900",
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
            "yellow": {
              "color": "yellow.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: { color: 'blue.100'; backgroundColor: 'blue.900' }
          red: { color: 'red.100' }
          yellow: { color: 'yellow.100' }
        }
      }>
    >()
  })

  test('config.extend + config.omit', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    })
      .config.extend({
        visual: {
          green: { color: 'green.100' },
          yellow: { color: 'yellow.100' },
        },
        size: {
          lg: { h: '12' },
          xl: { h: '14' },
        },
      })
      .config.omit('visual')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "lg": {
              "h": "12",
            },
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
            "xl": {
              "h": "14",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        size: {
          sm: { h: string }
          md: { h: string }
          lg: { h: string }
          xl: { h: string }
        }
      }>
    >()
  })

  test('config.extend + config.pick', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    })
      .config.extend({
        visual: {
          green: { color: 'green.100' },
          yellow: { color: 'yellow.100' },
        },
        size: {
          lg: { h: '12' },
          xl: { h: '14' },
        },
      })
      .config.pick('visual')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "green": {
              "color": "green.100",
            },
            "red": {
              "color": "red.100",
            },
            "yellow": {
              "color": "yellow.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: { color: 'blue.100' }
          red: { color: 'red.100' }
          green: { color: 'green.100' }
          yellow: { color: 'yellow.100' }
        }
      }>
    >()
  })

  test('config.extend + config.omit + config.pick', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    })
      .config.extend({
        visual: {
          green: { color: 'green.100' },
          yellow: { color: 'yellow.100' },
        },
        size: {
          lg: { h: '12' },
          xl: { h: '14' },
        },
      })
      .config.omit('visual')
      .config.pick('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "lg": {
              "h": "12",
            },
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
            "xl": {
              "h": "14",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        size: {
          sm: { h: string }
          md: { h: string }
          lg: { h: string }
          xl: { h: string }
        }
      }>
    >()
  })

  test('config.extend + config.pick + config.omit', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    })
      .config.extend({
        visual: {
          green: { color: 'green.100' },
          yellow: { color: 'yellow.100' },
        },
        size: {
          lg: { h: '12' },
          xl: { h: '14' },
        },
      })
      .config.pick('size')
      .config.omit('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {},
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<RecipeBuilder<never>>()
  })

  test('config.extend + config.omit + config.pick + config.extend', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    })
      .config.extend({
        visual: {
          green: { color: 'green.100' },
          yellow: { color: 'yellow.100' },
        },
        size: {
          lg: { h: '12' },
          xl: { h: '14' },
        },
      })
      .config.omit('visual')
      .config.pick('size')
      .config.extend({
        size: {
          xl: { h: '16' },
          xxl: { h: '18' },
        },
      })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "lg": {
              "h": "12",
            },
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
            "xl": {
              "h": "16",
            },
            "xxl": {
              "h": "18",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        size: {
          sm: { h: string }
          md: { h: string }
          lg: { h: string }
          xl: { h: string }
          xxl: { h: string }
        }
      }>
    >()
  })

  test('compoundVariants pick', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
      compoundVariants: [
        {
          visual: 'red',
          size: 'sm',
          css: {
            color: 'red',
          },
        },
        {
          size: 'md',
          css: {
            color: 'green',
          },
        },
        {
          visual: 'blue',
          css: {
            color: 'yellow',
          },
        },
      ],
    }).config.pick('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": [
          {
            "css": {
              "color": "red",
            },
            "size": "sm",
            "visual": "red",
          },
          {
            "css": {
              "color": "green",
            },
            "size": "md",
          },
        ],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        size: {
          sm: {
            h: string
          }
          md: {
            h: string
          }
        }
      }>
    >()
  })

  test('compoundVariants omit', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
      compoundVariants: [
        {
          visual: 'red',
          size: 'sm',
          css: {
            color: 'red',
          },
        },
        {
          size: 'md',
          css: {
            color: 'green',
          },
        },
      ],
    }).config.omit('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": [],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: {
            color: 'blue.100'
          }
          red: {
            color: 'red.100'
          }
        }
      }>
    >()
  })

  test('compoundVariants merge', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
      compoundVariants: [
        {
          visual: 'red',
          size: 'sm',
          css: {
            color: 'red',
          },
        },
        {
          size: 'md',
          css: {
            color: 'green',
          },
        },
      ],
    }).config.merge({
      className: 'btn',
      compoundVariants: [
        {
          visual: 'blue',
          size: 'sm',
          css: {
            color: 'blue',
          },
        },
        {
          size: 'md',
          css: {
            color: 'yellow',
          },
        },
      ],
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "compoundVariants": [
          {
            "css": {
              "color": "blue",
            },
            "size": "sm",
            "visual": "blue",
          },
          {
            "css": {
              "color": "yellow",
            },
            "size": "md",
          },
        ],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "variants": {
          "size": {
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
          },
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: {
            color: 'blue.100'
          }
          red: {
            color: 'red.100'
          }
        }
        size: {
          sm: {
            h: string
          }
          md: {
            h: string
          }
        }
      }>
    >()
  })

  test('defaultVariants merge', () => {
    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      defaultVariants: {
        visual: 'red',
        size: 'sm',
      },
      variants: {
        visual: {
          blue: { color: 'blue.100' },
          red: { color: 'red.100' },
        },
        size: {
          sm: { h: '8' },
          md: { h: '10' },
        },
      },
    }).config.merge({
      className: 'btn',
      defaultVariants: {
        visual: 'blue',
        size: null,
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "base": {
          "px": "4",
        },
        "className": "btn",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
        },
        "defaultVariants": {
          "size": null,
          "visual": "blue",
        },
        "variants": {
          "size": {
            "md": {
              "h": "10",
            },
            "sm": {
              "h": "8",
            },
          },
          "visual": {
            "blue": {
              "color": "blue.100",
            },
            "red": {
              "color": "red.100",
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      RecipeBuilder<{
        visual: {
          blue: {
            color: 'blue.100'
          }
          red: {
            color: 'red.100'
          }
        }
        size: {
          sm: {
            h: string
          }
          md: {
            h: string
          }
        }
      }>
    >()
  })
})
