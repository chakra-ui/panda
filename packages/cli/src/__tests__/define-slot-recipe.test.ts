import { describe, expect, expectTypeOf, test } from 'vitest'
import { defineSlotRecipe, type SlotRecipeBuilder } from '../define-slot-recipe'
import { defineRecipe } from '../define-recipe'

describe('define-recipe', () => {
  test('identity fn', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'icon' | 'root' | 'input',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('config.merge', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    }).config.merge({
      className: 'aaa',
      variants: {
        variant: {
          green: { root: { color: 'green.100' } },
          yellow: { root: { color: 'yellow.100' } },
        },
        size: {
          lg: { root: { h: '12' } },
          xl: { root: { h: '14' } },
        },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "aaa",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "lg": {
              "root": {
                "h": "12",
              },
            },
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
            "xl": {
              "root": {
                "h": "14",
              },
            },
          },
          "variant": {
            "green": {
              "root": {
                "color": "green.100",
              },
            },
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
            "yellow": {
              "root": {
                "color": "yellow.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'icon' | 'root' | 'input',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
            green: { root: { color: 'green.100' } }
            yellow: { root: { color: 'yellow.100' } }
          }
          size: {
            sm: { root: { h: string } }
            md: { root: { h: string } }
            lg: { root: { h: string } }
            xl: { root: { h: string } }
          }
        }
      >
    >()
  })

  test('config.omit', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    }).config.omit('variant')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('config.omit multiple', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    }).config.omit('variant', 'size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "border": {
            "dashed": {
              "root": {
                "border": "1px dashed",
              },
            },
            "solid": {
              "root": {
                "border": "1px solid",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          border: {
            solid: { root: { border: '1px solid' } }
            dashed: { root: { border: '1px dashed' } }
          }
        }
      >
    >()
  })

  test('config.pick', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    }).config.pick('variant')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
        }
      >
    >()
  })

  test('config.pick multiple', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    }).config.pick('variant', 'border')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "border": {
            "dashed": {
              "root": {
                "border": "1px dashed",
              },
            },
            "solid": {
              "root": {
                "border": "1px solid",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
          border: {
            solid: { root: { border: '1px solid' } }
            dashed: { root: { border: '1px dashed' } }
          }
        }
      >
    >()
  })

  test('config.extend', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    }).config.extend({
      variant: {
        green: { root: { color: 'green.100' } },
        yellow: { root: { color: 'yellow.100' } },
      },
      size: {
        lg: { root: { h: '12' } },
        xl: { root: { h: '14' } },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "lg": {
              "root": {
                "h": "12",
              },
            },
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
            "xl": {
              "root": {
                "h": "14",
              },
            },
          },
          "variant": {
            "green": {
              "root": {
                "color": "green.100",
              },
            },
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
            "yellow": {
              "root": {
                "color": "yellow.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
            green: { root: { color: 'green.100' } }
            yellow: { root: { color: 'yellow.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
            lg: { root: { h: string } }
            xl: { root: { h: string } }
          }
        }
      >
    >()
  })

  test('config.extend existing', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    }).config.extend({
      variant: {
        subtle: { root: { backgroundColor: 'blue.900' } },
        yellow: { root: { color: 'yellow.100' } },
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "backgroundColor": "blue.900",
                "color": "blue.100",
              },
            },
            "yellow": {
              "root": {
                "color": "yellow.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100'; backgroundColor: 'blue.900' } }
            solid: { root: { color: 'blue.100' } }
            yellow: { root: { color: 'yellow.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('config.extend + config.omit', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    })
      .config.extend({
        variant: {
          green: { root: { color: 'green.100' } },
          yellow: { root: { color: 'yellow.100' } },
        },
        size: {
          lg: { root: { h: '12' } },
          xl: { root: { h: '14' } },
        },
      })
      .config.omit('variant')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "lg": {
              "root": {
                "h": "12",
              },
            },
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
            "xl": {
              "root": {
                "h": "14",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
            lg: { root: { h: string } }
            xl: { root: { h: string } }
          }
        }
      >
    >()
  })

  test('config.extend + config.pick', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    })
      .config.extend({
        variant: {
          green: { root: { color: 'green.100' } },
          yellow: { root: { color: 'yellow.100' } },
        },
        size: {
          lg: { root: { h: '12' } },
          xl: { root: { h: '14' } },
        },
      })
      .config.pick('variant')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "variant": {
            "green": {
              "root": {
                "color": "green.100",
              },
            },
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
            "yellow": {
              "root": {
                "color": "yellow.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
            green: { root: { color: 'green.100' } }
            yellow: { root: { color: 'yellow.100' } }
          }
        }
      >
    >()
  })

  test('config.extend + config.omit + config.pick', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    })
      .config.extend({
        variant: {
          green: { root: { color: 'green.100' } },
          yellow: { root: { color: 'yellow.100' } },
        },
        size: {
          lg: { root: { h: '12' } },
          xl: { root: { h: '14' } },
        },
      })
      .config.omit('variant')
      .config.pick('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "lg": {
              "root": {
                "h": "12",
              },
            },
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
            "xl": {
              "root": {
                "h": "14",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
            green: { root: { color: 'green.100' } }
            yellow: { root: { color: 'yellow.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
            lg: { root: { h: string } }
            xl: { root: { h: string } }
          }
        }
      >
    >()
  })

  test('config.extend + config.pick + config.omit', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    })
      .config.extend({
        variant: {
          green: { root: { color: 'green.100' } },
          yellow: { root: { color: 'yellow.100' } },
        },
        size: {
          lg: { root: { h: '12' } },
          xl: { root: { h: '14' } },
        },
      })
      .config.pick('size')
      .config.omit('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {},
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<SlotRecipeBuilder<'root' | 'input' | 'icon', never>>()
  })

  test('config.extend + config.omit + config.pick + config.extend', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
    })
      .config.extend({
        variant: {
          green: { root: { color: 'green.100' } },
          yellow: { root: { color: 'yellow.100' } },
        },
        size: {
          lg: { root: { h: '12' } },
          xl: { root: { h: '14' } },
        },
      })
      .config.omit('variant')
      .config.pick('size')
      .config.extend({
        size: {
          xl: { root: { h: '16' } },
          xxl: { root: { h: '18' } },
        },
      })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": undefined,
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "lg": {
              "root": {
                "h": "12",
              },
            },
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
            "xl": {
              "root": {
                "h": "16",
              },
            },
            "xxl": {
              "root": {
                "h": "18",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
            lg: { root: { h: string } }
            xl: { root: { h: string } }
            xxl: { root: { h: string } }
          }
        }
      >
    >()
  })

  test('compoundVariants pick', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
      compoundVariants: [
        {
          variant: 'subtle',
          size: 'sm',
          css: { root: { color: 'red' } },
        },
        {
          size: 'md',
          css: { root: { color: 'green' } },
        },
        {
          variant: 'solid',
          css: { root: { color: 'yellow' } },
        },
      ],
    }).config.pick('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": [
          {
            "css": {
              "root": {
                "color": "red",
              },
            },
            "size": "sm",
            "variant": "subtle",
          },
          {
            "css": {
              "root": {
                "color": "green",
              },
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
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('compoundVariants omit', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
        border: {
          solid: { root: { border: '1px solid' } },
          dashed: { root: { border: '1px dashed' } },
        },
      },
      compoundVariants: [
        {
          variant: 'subtle',
          size: 'sm',
          css: { root: { color: 'red' } },
        },
        {
          size: 'md',
          css: { root: { color: 'green' } },
        },
        {
          variant: 'solid',
          css: { root: { color: 'yellow' } },
        },
      ],
    }).config.omit('size')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": [
          {
            "css": {
              "root": {
                "color": "yellow",
              },
            },
            "variant": "solid",
          },
        ],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "border": {
            "dashed": {
              "root": {
                "border": "1px dashed",
              },
            },
            "solid": {
              "root": {
                "border": "1px solid",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
        }
      >
    >()
  })

  test('compoundVariants merge', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
      compoundVariants: [
        {
          variant: 'subtle',
          size: 'sm',
          css: { root: { color: 'red' } },
        },
        {
          size: 'md',
          css: { root: { color: 'green' } },
        },
        {
          variant: 'solid',
          css: { root: { color: 'yellow' } },
        },
      ],
    }).config.merge({
      className: 'btn',
      compoundVariants: [
        {
          variant: 'subtle',
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
        "className": "btn",
        "compoundVariants": [
          {
            "css": {
              "color": "blue",
              "root": {
                "color": "red",
              },
            },
            "size": "sm",
            "variant": "subtle",
          },
          {
            "css": {
              "color": "yellow",
              "root": {
                "color": "green",
              },
            },
            "size": "md",
          },
          {
            "css": {
              "root": {
                "color": "yellow",
              },
            },
            "variant": "solid",
          },
        ],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'icon' | 'root' | 'input',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('defaultVariants merge', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      defaultVariants: {
        variant: 'solid',
        size: 'sm',
      },
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
      compoundVariants: [
        {
          variant: 'subtle',
          size: 'sm',
          css: { root: { color: 'red' } },
        },
        {
          size: 'md',
          css: { root: { color: 'green' } },
        },
        {
          variant: 'solid',
          css: { root: { color: 'yellow' } },
        },
      ],
    }).config.merge({
      className: 'btn',
      defaultVariants: {
        variant: 'subtle',
        size: null,
      },
    })

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "btn",
        "compoundVariants": [
          {
            "css": {
              "root": {
                "color": "red",
              },
            },
            "size": "sm",
            "variant": "subtle",
          },
          {
            "css": {
              "root": {
                "color": "green",
              },
            },
            "size": "md",
          },
          {
            "css": {
              "root": {
                "color": "yellow",
              },
            },
            "variant": "solid",
          },
        ],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "defaultVariants": {
          "size": null,
          "variant": "subtle",
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'icon' | 'root' | 'input',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('config.slots.add', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { root: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { root: { fontSize: 'md' } },
        },
      },
    }).config.slots.add('title')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
          "title",
        ],
        "variants": {
          "size": {
            "md": {
              "root": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "solid": {
              "root": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'icon' | 'root' | 'input' | 'title',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { root: { color: 'blue.100' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { root: { fontSize: 'md' } }
          }
        }
      >
    >()
  })

  test('config.slots.pick', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { icon: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { icon: { fontSize: 'md' } },
        },
      },
    }).config.slots.pick('icon')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": [],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "icon",
        ],
        "variants": {
          "size": {
            "md": {
              "icon": {
                "fontSize": "md",
              },
            },
            "sm": {},
          },
          "variant": {
            "solid": {
              "icon": {
                "color": "blue.100",
              },
            },
            "subtle": {},
          },
        },
      }
    `)
    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'icon',
        {
          variant: {
            subtle: {}
            solid: {
              icon: {
                color: 'blue.100'
              }
            }
          }
          size: {
            sm: {}
            md: {
              icon: {
                fontSize: 'md'
              }
            }
          }
        }
      >
    >()
  })

  test('config.slots.omit', () => {
    const recipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { icon: { color: 'blue.100' } },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { icon: { fontSize: 'md' } },
        },
      },
    }).config.slots.omit('icon')

    expect(recipe).toMatchInlineSnapshot(`
      {
        "className": "card",
        "compoundVariants": [],
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
        ],
        "variants": {
          "size": {
            "md": {},
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "solid": {},
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)

    expectTypeOf(recipe).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: {}
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: {}
          }
        }
      >
    >()
  })

  test('config.slots.assignTo', () => {
    const slotRecipe = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      base: { root: { border: 'none' }, input: { margin: '2' } },
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
          solid: { icon: { color: 'blue.100' } },
          outline: { input: { mx: 2 } },
          empty: { input: {} },
        },
        size: {
          sm: { root: { fontSize: 'sm' } },
          md: { icon: { fontSize: 'md' } },
          lg: { input: { fontSize: 'lg' } },
        },
      },
    })

    const recipe = defineRecipe({
      className: 'btn',
      base: { px: '4' },
      variants: {
        variant: {
          outline: { color: 'green.100' },
          empty: { border: 'none' },
        },
        size: {
          lg: { fontSize: 'xl', h: '10' },
        },
      },
    })

    const assigned = slotRecipe.config.slots.assignTo('input', recipe)
    expect(assigned).toMatchInlineSnapshot(`
      {
        "base": {
          "input": {
            "margin": "2",
            "px": "4",
          },
          "root": {
            "border": "none",
          },
        },
        "className": "card",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "size": {
            "lg": {
              "input": {
                "fontSize": "xl",
                "h": "10",
              },
            },
            "md": {
              "icon": {
                "fontSize": "md",
              },
            },
            "sm": {
              "root": {
                "fontSize": "sm",
              },
            },
          },
          "variant": {
            "empty": {
              "input": {
                "border": "none",
              },
            },
            "outline": {
              "input": {
                "color": "green.100",
                "mx": 2,
              },
            },
            "solid": {
              "icon": {
                "color": "blue.100",
              },
            },
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)

    expectTypeOf(assigned).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
            solid: { icon: { color: 'blue.100' } }
            outline: { input: { mx: number } | { color: 'green.100' } }
            empty: { input: { border: 'none' } }
          }
          size: {
            sm: { root: { fontSize: 'sm' } }
            md: { icon: { fontSize: 'md' } }
            lg: { input: { fontSize: 'xl'; h: string } }
          }
        }
      >
    >()
  })

  test("config.slots.assignTo with a variant key that doesn't exist", () => {
    // spoiler: nothing happens

    const button = defineRecipe({
      className: 'btn',
      variants: {
        variant: { primary: { color: 'red' } },
      },
    })

    const card = defineSlotRecipe({
      className: 'card',
      slots: ['root', 'input', 'icon'],
      variants: {
        variant: {
          subtle: { root: { color: 'blue.100' } },
        },
      },
    })

    const assigned = card.config.slots.assignTo('input', button)
    expect(assigned).toMatchInlineSnapshot(`
      {
        "base": {},
        "className": "card",
        "config": {
          "cast": [Function],
          "extend": [Function],
          "merge": [Function],
          "omit": [Function],
          "pick": [Function],
          "slots": {
            "add": [Function],
            "assignTo": [Function],
            "omit": [Function],
            "pick": [Function],
          },
        },
        "slots": [
          "root",
          "input",
          "icon",
        ],
        "variants": {
          "variant": {
            "subtle": {
              "root": {
                "color": "blue.100",
              },
            },
          },
        },
      }
    `)

    expectTypeOf(assigned).toMatchTypeOf<
      SlotRecipeBuilder<
        'root' | 'input' | 'icon',
        {
          variant: {
            subtle: { root: { color: 'blue.100' } }
          }
        }
      >
    >()
  })
})
