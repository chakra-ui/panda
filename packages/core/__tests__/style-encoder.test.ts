import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { Dict, SystemStyleObject } from '@pandacss/types'
import { createGeneratorContext } from '@pandacss/fixture'
import { createAnatomy } from './create-anatomy'

// ???
const css = (styles: Dict) => {
  const ctx = createGeneratorContext()
  ctx.encoder.processAtomic(styles)
  return ctx.encoder.atomic
}

// ???
const recipe = (name: string, styles: Dict) => {
  const ctx = createGeneratorContext()
  const recipeConfig = ctx.recipes.getConfig(name)
  if (!recipeConfig) throw new Error(`Recipe ${name} not found`)

  ctx.encoder.processRecipe(name, styles)
  if ('slots' in recipeConfig) {
    const base = {} as Dict
    recipeConfig.slots.map((slot) => {
      const recipeKey = ctx.recipes.getSlotKey(name, slot)
      base[slot] = ctx.encoder.recipes_base.get(recipeKey)!
    })
    return { base, variants: ctx.encoder.recipes.get(name)! }
  }

  return { base: ctx.encoder.recipes_base.get(name)!, variants: ctx.encoder.recipes.get(name)! }
}

const cva = (styles: Dict) => {
  const ctx = createGeneratorContext()
  if ('slots' in styles) {
    ctx.encoder.processAtomicSlotRecipe(styles)
  }

  ctx.encoder.processAtomicRecipe(styles)
  return ctx.encoder.atomic
}

describe('hash factory', () => {
  test('css', () => {
    const result = css({
      color: 'red !important',
      border: '1px solid token(colors.red.100)',
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
        "border]___[value:1px solid token(colors.red.100)",
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
    expect(result.base).toMatchInlineSnapshot(`
      {
        "control": Set {
          "borderWidth]___[value:1px]___[recipe:checkbox]___[slot:control",
          "borderRadius]___[value:sm]___[recipe:checkbox]___[slot:control",
        },
        "label": Set {
          "marginInlineStart]___[value:2]___[recipe:checkbox]___[slot:label",
        },
        "root": Set {
          "display]___[value:flex]___[recipe:checkbox]___[slot:root",
          "alignItems]___[value:center]___[recipe:checkbox]___[slot:root",
          "gap]___[value:2]___[recipe:checkbox]___[slot:root",
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
    expect(processor.encoder?.results).toMatchInlineSnapshot(`
      {
        "atomic": Set {},
        "recipes": Map {
          "button" => Set {},
        },
        "recipes_base": Map {
          "button" => Set {
            "lineHeight]___[value:1.2]___[recipe:button",
            "boxShadow]___[value:outline]___[cond:_focusVisible]___[recipe:button",
            "opacity]___[value:0.4]___[cond:_disabled]___[recipe:button",
            "background]___[value:initial]___[cond:_hover<___>_disabled]___[recipe:button",
            "display]___[value:inline-flex]___[recipe:button",
            "outline]___[value:none]___[recipe:button",
            "zIndex]___[value:1]___[cond:_focus]___[recipe:button",
          },
        },
      }
    `)

    // TODO CHECK this is fixed after deterministic sorting without postcss from next PR
    // https://github.com/chakra-ui/panda/pull/1544/commits/845c80b643835187b8b2eb71e30648254c510fa9#diff-7d68ca7544b231a589614aba6161eb58fbe12f599544f40b6419e5eb5988729aR158-R176
    expect(result.toCss()).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .btn {
            line-height: 1.2;
      }

          .btn:is(:disabled, [disabled], [data-disabled]) {
            opacity: 0.4;
      }

          .btn {
            display: inline-flex;
            outline: var(--borders-none);
      }

          .btn:is(:focus-visible, [data-focus-visible]) {
            box-shadow: outline;
      }

          .btn:is(:focus, [data-focus]) {
            z-index: 1;
      }

          .btn:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled]) {
            background: initial;
      }
          }
      }"
    `)
  })

  test('simple recipe with alterning no-condition/condition props', () => {
    interface Part {
      selector: string
    }

    type Parts = Record<string, Part>

    function defineParts<T extends Parts>(parts: T) {
      return function (
        config: Partial<Record<keyof T, SystemStyleObject>>,
      ): Partial<Record<keyof T, SystemStyleObject>> {
        return Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value])) as any
      }
    }

    const anatomy = createAnatomy('navbar', [
      'root',
      'blur',
      'nav',
      'logoLink',
      'menuLink',
      'menuLinkIcon',
      'navLink',
      'navLinkText',
      'projectLink',
      'chatLink',
      'mobileMenu',
    ])

    const parts = defineParts(anatomy.build())

    const processor = createRuleProcessor({
      conditions: {
        extend: {
          supportsBackdrop: '@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))',
        },
      },
      theme: {
        extend: {
          recipes: {
            button: {
              className: 'navbar',
              base: parts({
                blur: {
                  _dark: {
                    bg: 'dark',
                    shadow: '0 -1px 0 rgba(255,255,255,.1) inset',
                  },
                  shadow: '0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)',
                  _supportsBackdrop: {
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85) !important',
                    _dark: {
                      backgroundColor: 'hsla(0,0%,7%,.8) !important',
                    },
                  },
                },
              }),
            },
          },
        },
      },
    })

    const result = processor.recipe('button', {})!
    expect(result.className).toMatchInlineSnapshot(`
      [
        "navbar",
      ]
    `)
    expect(processor.encoder?.results).toMatchInlineSnapshot(`
      {
        "atomic": Set {},
        "recipes": Map {
          "button" => Set {},
        },
        "recipes_base": Map {
          "button" => Set {
            "background]___[value:dark]___[cond:&[data-part=\\"blur\\"]<___>_dark]___[recipe:button",
            "boxShadow]___[value:0 -1px 0 rgba(255,255,255,.1) inset]___[cond:&[data-part=\\"blur\\"]<___>_dark]___[recipe:button",
            "boxShadow]___[value:0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)]___[cond:&[data-part=\\"blur\\"]]___[recipe:button",
            "backdropFilter]___[value:blur(8px)]___[cond:&[data-part=\\"blur\\"]<___>_supportsBackdrop]___[recipe:button",
            "backgroundColor]___[value:rgba(255, 255, 255, 0.85) !important]___[cond:&[data-part=\\"blur\\"]<___>_supportsBackdrop]___[recipe:button",
            "backgroundColor]___[value:hsla(0,0%,7%,.8) !important]___[cond:&[data-part=\\"blur\\"]<___>_supportsBackdrop<___>_dark]___[recipe:button",
          },
        },
      }
    `)

    expect(result.toCss()).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          [data-theme=dark] .navbar[data-part=\\"blur\\"], .dark .navbar[data-part=\\"blur\\"], .navbar[data-part=\\"blur\\"].dark, .navbar[data-part=\\"blur\\"][data-theme=dark] {
            background: dark;
            box-shadow: 0 -1px 0 rgba(255,255,255,.1) inset;
      }

          .navbar[data-part=\\"blur\\"] {
            box-shadow: 0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06);
      }

          @supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
            [data-theme=dark] .navbar[data-part=\\"blur\\"], .dark .navbar[data-part=\\"blur\\"], .navbar[data-part=\\"blur\\"].dark, .navbar[data-part=\\"blur\\"][data-theme=dark] {
              background-color: hsla(0,0%,7%,.8) !important;
          }
      }

          @supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
            .navbar[data-part=\\"blur\\"] {
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              background-color: rgba(255, 255, 255, 0.85) !important;
          }
      }
          }
      }"
    `)
  })

  test('fromJSON', () => {
    const ctx = createGeneratorContext()
    const hf = ctx.encoder
    hf.fromJSON(JSON.stringify({ styles: { atomic: ['color]___[value:red', 'color]___[value:blue'] } }))
    expect(hf.atomic).toMatchInlineSnapshot(`
      Set {
        "color]___[value:red",
        "color]___[value:blue",
      }
    `)

    hf.fromJSON(JSON.stringify({ styles: { recipes: { buttonStyle: ['variant]___[value:solid'] } } }))
    expect(hf.recipes).toMatchInlineSnapshot(`
      Map {
        "buttonStyle" => Set {
          "variant]___[value:solid",
        },
      }
    `)

    expect(hf.recipes_base).toMatchInlineSnapshot(`
      Map {
        "buttonStyle" => Set {
          "display]___[value:inline-flex]___[recipe:buttonStyle",
          "alignItems]___[value:center]___[recipe:buttonStyle",
          "justifyContent]___[value:center]___[recipe:buttonStyle",
          "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
        },
      }
    `)

    expect(
      hf.clone().fromJSON(
        JSON.stringify({
          styles: {
            atomic: [
              'display]___[value:none',
              'height]___[value:100%',
              'transition]___[value:all .3s ease-in-out',
              'opacity]___[value:0 !important',
              'opacity]___[value:1',
              'height]___[value:10px',
              'backgroundGradient]___[value:to-b',
              'gradientFrom]___[value:rgb(200 200 200 / .4)',
            ],
            recipes: {
              checkbox: [
                'size]___[value:md]___[recipe:checkbox]___[slot:container',
                'size]___[value:md]___[recipe:checkbox]___[slot:control',
                'size]___[value:md]___[recipe:checkbox]___[slot:label',
              ],
            },
          },
        }),
      ).results,
    ).toMatchInlineSnapshot(`
      {
        "atomic": Set {
          "display]___[value:none",
          "height]___[value:100%",
          "transition]___[value:all .3s ease-in-out",
          "opacity]___[value:0 !important",
          "opacity]___[value:1",
          "height]___[value:10px",
          "backgroundGradient]___[value:to-b",
          "gradientFrom]___[value:rgb(200 200 200 / .4)",
        },
        "recipes": Map {
          "checkbox" => Set {
            "size]___[value:md]___[recipe:checkbox]___[slot:container",
            "size]___[value:md]___[recipe:checkbox]___[slot:control",
            "size]___[value:md]___[recipe:checkbox]___[slot:label",
          },
        },
        "recipes_base": Map {
          "checkbox__root" => Set {
            "display]___[value:flex]___[recipe:checkbox",
            "alignItems]___[value:center]___[recipe:checkbox",
            "gap]___[value:2]___[recipe:checkbox",
          },
          "checkbox__control" => Set {
            "borderWidth]___[value:1px]___[recipe:checkbox",
            "borderRadius]___[value:sm]___[recipe:checkbox",
          },
          "checkbox__label" => Set {
            "marginInlineStart]___[value:2]___[recipe:checkbox",
          },
        },
      }
    `)
  })
})