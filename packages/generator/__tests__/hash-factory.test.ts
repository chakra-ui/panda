import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { Dict } from '@pandacss/types'
import { createGeneratorContext } from '@pandacss/fixture'

const css = (styles: Dict) => {
  const ctx = createGeneratorContext()
  ctx.hashFactory.processAtomic(styles)
  return ctx.hashFactory.atomic
}

const recipe = (name: string, styles: Dict) => {
  const ctx = createGeneratorContext()
  if ('slots' in styles) {
    ctx.hashFactory.processSlotRecipe(name, styles)
    return { base: ctx.hashFactory.recipes_slots_base.get(name)!, variants: ctx.hashFactory.recipes_slots.get(name)! }
  }

  ctx.hashFactory.processRecipe(name, styles)
  return { base: ctx.hashFactory.recipes_base.get(name)!, variants: ctx.hashFactory.recipes.get(name)! }
}

const cva = (styles: Dict) => {
  const ctx = createGeneratorContext()
  if ('slots' in styles) {
    ctx.hashFactory.processAtomicSlotRecipe(styles)
  }

  ctx.hashFactory.processAtomicRecipe(styles)
  return ctx.hashFactory.atomic
}

describe('hash factory', () => {
  test('css', () => {
    const result = css({
      color: 'red !important',
      border: '1px solid token(red.100)',
      bg: 'blue.300',
      textStyle: 'headline.h1',
      w: [1, 2, undefined, null, 3],
      fontSize: {
        base: 'xs',
        sm: 'sm',
        _hover: {
          base: 'md',
          md: 'lg',
          _focus: 'xl',
        },
        _dark: '2xl',
      },
      sm: {
        color: 'yellow',
        backgroundColor: {
          base: 'red',
          _hover: 'green',
        },
      },
      "&[data-attr='test']": {
        color: 'green',
        _expanded: {
          color: 'purple',
          '.target &': {
            color: {
              base: 'cyan',
              _opened: 'orange',
              _xl: 'pink',
            },
          },
        },
      },
    })

    expect(result).toMatchInlineSnapshot(
      `
      Set {
        "color]___[value:red !important",
        "border]___[value:1px solid token(red.100)",
        "background]___[value:blue.300",
        "textStyle]___[value:headline.h1",
        "width]___[value:1",
        "width]___[value:2]___[cond:sm",
        "width]___[value:3]___[cond:xl",
        "fontSize]___[value:xs",
        "fontSize]___[value:sm]___[cond:sm",
        "fontSize]___[value:md]___[cond:_hover",
        "fontSize]___[value:lg]___[cond:_hover<___>md",
        "fontSize]___[value:xl]___[cond:_hover<___>_focus",
        "fontSize]___[value:2xl]___[cond:_dark",
        "color]___[value:yellow]___[cond:sm",
        "backgroundColor]___[value:red]___[cond:sm",
        "backgroundColor]___[value:green]___[cond:sm<___>_hover",
        "color]___[value:green]___[cond:&[data-attr='test']",
        "color]___[value:purple]___[cond:&[data-attr='test']<___>_expanded",
        "color]___[value:cyan]___[cond:&[data-attr='test']<___>_expanded<___>.target &",
        "_opened]___[value:orange]___[cond:&[data-attr='test']<___>_expanded<___>.target &",
        "_xl]___[value:pink]___[cond:&[data-attr='test']<___>_expanded<___>.target &",
      }
    `,
    )
  })

  test('recipe', () => {
    const result = recipe('buttonStyle', { size: { base: 'sm', md: 'md' } })

    expect(result).toMatchInlineSnapshot(`
      {
        "base": Set {
          "display]___[value:inline-flex]___[recipe:buttonStyle",
          "alignItems]___[value:center]___[recipe:buttonStyle",
          "justifyContent]___[value:center]___[recipe:buttonStyle",
          "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
        },
        "variants": Set {
          "size]___[value:sm]___[recipe:buttonStyle",
          "size]___[value:md]___[cond:md]___[recipe:buttonStyle",
          "variant]___[value:solid]___[recipe:buttonStyle",
        },
      }
    `)
  })

  test('cva', () => {
    // packages/fixture/src/recipes.ts
    const buttonStyle = cva({
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      variants: {
        size: {
          sm: {
            textStyle: 'headline.h1',
            height: '2.5rem',
            minWidth: '2.5rem',
            padding: '0 0.5rem',
          },
          md: {
            height: '3rem',
            minWidth: '3rem',
            padding: '0 0.75rem',
          },
        },
        variant: {
          solid: {
            backgroundColor: 'blue',
            color: 'white',
            _hover: {
              backgroundColor: 'darkblue',
            },
            '&[data-disabled]': {
              backgroundColor: 'gray',
              color: 'black',
            },
          },
          outline: {
            backgroundColor: 'transparent',
            border: '1px solid blue',
            color: 'blue',
            _hover: {
              backgroundColor: 'blue',
              color: 'white',
            },
            '&[data-disabled]': {
              backgroundColor: 'transparent',
              border: '1px solid gray',
              color: 'gray',
            },
          },
        },
      },
      defaultVariants: {
        size: 'md',
        variant: 'solid',
      },
    })

    expect(buttonStyle).toMatchInlineSnapshot(`
      Set {
        "display]___[value:inline-flex",
        "alignItems]___[value:center",
        "justifyContent]___[value:center",
        "textStyle]___[value:headline.h1",
        "height]___[value:2.5rem",
        "minWidth]___[value:2.5rem",
        "padding]___[value:0 0.5rem",
        "height]___[value:3rem",
        "minWidth]___[value:3rem",
        "padding]___[value:0 0.75rem",
        "backgroundColor]___[value:blue",
        "color]___[value:white",
        "backgroundColor]___[value:darkblue]___[cond:_hover",
        "backgroundColor]___[value:gray]___[cond:&[data-disabled]",
        "color]___[value:black]___[cond:&[data-disabled]",
        "backgroundColor]___[value:transparent",
        "border]___[value:1px solid blue",
        "color]___[value:blue",
        "backgroundColor]___[value:blue]___[cond:_hover",
        "color]___[value:white]___[cond:_hover",
        "backgroundColor]___[value:transparent]___[cond:&[data-disabled]",
        "border]___[value:1px solid gray]___[cond:&[data-disabled]",
        "color]___[value:gray]___[cond:&[data-disabled]",
      }
    `)
  })

  test('slot recipe', () => {
    const result = recipe('checkbox', { size: { base: 'sm', md: 'md' } })

    expect(result.variants).toMatchInlineSnapshot(`
      Set {
        "size]___[value:sm]___[recipe:checkbox",
        "size]___[value:md]___[cond:md]___[recipe:checkbox",
      }
    `)
    expect(result).toMatchInlineSnapshot(`
      {
        "base": Set {
          "display]___[value:flex]___[recipe:checkbox",
          "alignItems]___[value:center]___[recipe:checkbox",
          "gap]___[value:2]___[recipe:checkbox",
          "borderWidth]___[value:1px]___[recipe:checkbox",
          "borderRadius]___[value:sm]___[recipe:checkbox",
          "marginInlineStart]___[value:2]___[recipe:checkbox",
        },
        "variants": Set {
          "size]___[value:sm]___[recipe:checkbox",
          "size]___[value:md]___[cond:md]___[recipe:checkbox",
        },
      }
    `)
  })

  test('sva', () => {
    // packages/fixture/src/slot-recipes.ts
    const checkbox = cva({
      slots: ['root', 'control', 'label'],
      base: {
        root: { display: 'flex', alignItems: 'center', gap: '2' },
        control: { borderWidth: '1px', borderRadius: 'sm' },
        label: { marginStart: '2' },
      },
      variants: {
        size: {
          sm: {
            control: { width: '8', height: '8' },
            label: { fontSize: 'sm' },
          },
          md: {
            control: { width: '10', height: '10' },
            label: { fontSize: 'md' },
          },
          lg: {
            control: { width: '12', height: '12' },
            label: { fontSize: 'lg' },
          },
        },
      },
      defaultVariants: {
        size: 'sm',
      },
    })

    expect(checkbox).toMatchInlineSnapshot(`
      Set {
        "display]___[value:flex",
        "alignItems]___[value:center",
        "gap]___[value:2",
        "borderWidth]___[value:1px",
        "borderRadius]___[value:sm",
        "width]___[value:8",
        "height]___[value:8",
        "width]___[value:10",
        "height]___[value:10",
        "width]___[value:12",
        "height]___[value:12",
        "marginInlineStart]___[value:2",
        "fontSize]___[value:sm",
        "fontSize]___[value:md",
        "fontSize]___[value:lg",
      }
    `)
  })

  test('simple recipe with alterning no-condition/condition props', () => {
    const processor = createRuleProcessor({
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'btn',
              base: {
                lineHeight: '1.2',
                _focusVisible: {
                  boxShadow: 'outline',
                },
                _disabled: {
                  opacity: 0.4,
                },
                _hover: {
                  _disabled: { bg: 'initial' },
                },
                display: 'inline-flex',
                outline: 'none',
                _focus: {
                  zIndex: 1,
                },
              },
            },
          },
        },
      },
    })

    const result = processor.recipe('button', {})!
    expect(result.className).toMatchInlineSnapshot(`
      [
        "btn",
      ]
    `)
  })
})
