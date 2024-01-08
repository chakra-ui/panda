import { createGeneratorContext } from '@pandacss/fixture'
import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

/* -----------------------------------------------------------------------------
 * Test Setup
 * -----------------------------------------------------------------------------*/

const css = (styles: Dict) => {
  const ctx = createGeneratorContext()
  ctx.encoder.processAtomic(styles)
  ctx.decoder.collect(ctx.encoder)
  return ctx.decoder.atomic
}

const recipe = (name: string, styles: Dict) => {
  const ctx = createGeneratorContext()
  ctx.encoder.processRecipe(name, styles)
  ctx.decoder.collect(ctx.encoder)
  return ctx.decoder.getRecipeResult(name)
}

const cva = (styles: Dict) => {
  const ctx = createGeneratorContext()
  ctx.encoder.processAtomicRecipe(styles)
  ctx.decoder.collect(ctx.encoder)
  return ctx.decoder.atomic
}

const sva = (styles: Dict) => {
  const ctx = createGeneratorContext()
  ctx.encoder.processAtomicSlotRecipe(styles)
  ctx.decoder.collect(ctx.encoder)
  return ctx.decoder.atomic
}

/* -----------------------------------------------------------------------------
 * Actual Tests
 * -----------------------------------------------------------------------------*/

describe('style decoder', () => {
  test('should resolve references', () => {
    const result = css({
      border: '2px solid {colors.red.300}',
    })

    expect(result).toMatchInlineSnapshot(`
      Set {
        {
          "className": "border_2px_solid_\\\\{colors\\\\.red\\\\.300\\\\}",
          "conditions": undefined,
          "entry": {
            "prop": "border",
            "value": "2px solid {colors.red.300}",
          },
          "hash": "border]___[value:2px solid {colors.red.300}",
          "layer": undefined,
          "result": {
            ".border_2px_solid_\\\\{colors\\\\.red\\\\.300\\\\}": {
              "border": "2px solid var(--colors-red-300)",
            },
          },
        },
      }
    `)
  })

  test('css with base', () => {
    const result = css({
      base: { color: 'blue' },
      md: { color: 'red' },
    })

    expect(result).toMatchInlineSnapshot(`
      Set {
        {
          "className": "text_blue",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "blue",
          },
          "hash": "color]___[value:blue",
          "layer": undefined,
          "result": {
            ".text_blue": {
              "color": "blue",
            },
          },
        },
        {
          "className": "md\\\\:text_red",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 48em)",
              "raw": "md",
              "rawValue": "@media screen and (min-width: 48em)",
              "type": "at-rule",
              "value": "md",
            },
          ],
          "entry": {
            "cond": "md",
            "prop": "color",
            "value": "red",
          },
          "hash": "color]___[value:red]___[cond:md",
          "layer": undefined,
          "result": {
            ".md\\\\:text_red": {
              "@media screen and (min-width: 48em)": {
                "color": "red",
              },
            },
          },
        },
      }
    `)
  })

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
              _open: 'orange',
              xl: 'pink',
            },
          },
        },
      },
    })

    expect(result).toMatchInlineSnapshot(
      `
      Set {
        {
          "className": "text_red",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "red !important",
          },
          "hash": "color]___[value:red !important",
          "layer": undefined,
          "result": {
            ".text_red\\\\!": {
              "color": "red !important",
            },
          },
        },
        {
          "className": "border_1px_solid_token\\\\(colors\\\\.red\\\\.100\\\\)",
          "conditions": undefined,
          "entry": {
            "prop": "border",
            "value": "1px solid token(colors.red.100)",
          },
          "hash": "border]___[value:1px solid token(colors.red.100)",
          "layer": undefined,
          "result": {
            ".border_1px_solid_token\\\\(colors\\\\.red\\\\.100\\\\)": {
              "border": "1px solid token(colors.red.100)",
            },
          },
        },
        {
          "className": "bg_blue\\\\.300",
          "conditions": undefined,
          "entry": {
            "prop": "background",
            "value": "blue.300",
          },
          "hash": "background]___[value:blue.300",
          "layer": undefined,
          "result": {
            ".bg_blue\\\\.300": {
              "background": "var(--colors-blue-300)",
            },
          },
        },
        {
          "className": "textStyle_headline\\\\.h1",
          "conditions": undefined,
          "entry": {
            "prop": "textStyle",
            "value": "headline.h1",
          },
          "hash": "textStyle]___[value:headline.h1",
          "layer": "compositions",
          "result": {
            ".textStyle_headline\\\\.h1": {
              "fontSize": "2rem",
              "fontWeight": "var(--font-weights-bold)",
            },
          },
        },
        {
          "className": "w_1",
          "conditions": undefined,
          "entry": {
            "prop": "width",
            "value": 1,
          },
          "hash": "width]___[value:1",
          "layer": undefined,
          "result": {
            ".w_1": {
              "width": "var(--sizes-1)",
            },
          },
        },
        {
          "className": "sm\\\\:w_2",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 40em)",
              "raw": "sm",
              "rawValue": "@media screen and (min-width: 40em)",
              "type": "at-rule",
              "value": "sm",
            },
          ],
          "entry": {
            "cond": "sm",
            "prop": "width",
            "value": 2,
          },
          "hash": "width]___[value:2]___[cond:sm",
          "layer": undefined,
          "result": {
            ".sm\\\\:w_2": {
              "@media screen and (min-width: 40em)": {
                "width": "var(--sizes-2)",
              },
            },
          },
        },
        {
          "className": "xl\\\\:w_3",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 80em)",
              "raw": "xl",
              "rawValue": "@media screen and (min-width: 80em)",
              "type": "at-rule",
              "value": "xl",
            },
          ],
          "entry": {
            "cond": "xl",
            "prop": "width",
            "value": 3,
          },
          "hash": "width]___[value:3]___[cond:xl",
          "layer": undefined,
          "result": {
            ".xl\\\\:w_3": {
              "@media screen and (min-width: 80em)": {
                "width": "var(--sizes-3)",
              },
            },
          },
        },
        {
          "className": "fs_xs",
          "conditions": undefined,
          "entry": {
            "prop": "fontSize",
            "value": "xs",
          },
          "hash": "fontSize]___[value:xs",
          "layer": undefined,
          "result": {
            ".fs_xs": {
              "fontSize": "var(--font-sizes-xs)",
            },
          },
        },
        {
          "className": "sm\\\\:fs_sm",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 40em)",
              "raw": "sm",
              "rawValue": "@media screen and (min-width: 40em)",
              "type": "at-rule",
              "value": "sm",
            },
          ],
          "entry": {
            "cond": "sm",
            "prop": "fontSize",
            "value": "sm",
          },
          "hash": "fontSize]___[value:sm]___[cond:sm",
          "layer": undefined,
          "result": {
            ".sm\\\\:fs_sm": {
              "@media screen and (min-width: 40em)": {
                "fontSize": "var(--font-sizes-sm)",
              },
            },
          },
        },
        {
          "className": "hover\\\\:fs_md",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
          ],
          "entry": {
            "cond": "_hover",
            "prop": "fontSize",
            "value": "md",
          },
          "hash": "fontSize]___[value:md]___[cond:_hover",
          "layer": undefined,
          "result": {
            ".hover\\\\:fs_md": {
              "&:is(:hover, [data-hover])": {
                "fontSize": "var(--font-sizes-md)",
              },
            },
          },
        },
        {
          "className": "hover\\\\:md\\\\:fs_lg",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 48em)",
              "raw": "md",
              "rawValue": "@media screen and (min-width: 48em)",
              "type": "at-rule",
              "value": "md",
            },
          ],
          "entry": {
            "cond": "_hover<___>md",
            "prop": "fontSize",
            "value": "lg",
          },
          "hash": "fontSize]___[value:lg]___[cond:_hover<___>md",
          "layer": undefined,
          "result": {
            ".hover\\\\:md\\\\:fs_lg": {
              "&:is(:hover, [data-hover])": {
                "@media screen and (min-width: 48em)": {
                  "fontSize": "var(--font-sizes-lg)",
                },
              },
            },
          },
        },
        {
          "className": "hover\\\\:focus\\\\:fs_xl",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
            {
              "raw": "&:is(:focus, [data-focus])",
              "type": "self-nesting",
              "value": "&:is(:focus, [data-focus])",
            },
          ],
          "entry": {
            "cond": "_hover<___>_focus",
            "prop": "fontSize",
            "value": "xl",
          },
          "hash": "fontSize]___[value:xl]___[cond:_hover<___>_focus",
          "layer": undefined,
          "result": {
            ".hover\\\\:focus\\\\:fs_xl": {
              "&:is(:hover, [data-hover])": {
                "&:is(:focus, [data-focus])": {
                  "fontSize": "var(--font-sizes-xl)",
                },
              },
            },
          },
        },
        {
          "className": "dark\\\\:fs_2xl",
          "conditions": [
            {
              "raw": "[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]",
              "type": "combinator-nesting",
              "value": "[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]",
            },
          ],
          "entry": {
            "cond": "_dark",
            "prop": "fontSize",
            "value": "2xl",
          },
          "hash": "fontSize]___[value:2xl]___[cond:_dark",
          "layer": undefined,
          "result": {
            ".dark\\\\:fs_2xl": {
              "[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]": {
                "fontSize": "var(--font-sizes-2xl)",
              },
            },
          },
        },
        {
          "className": "sm\\\\:text_yellow",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 40em)",
              "raw": "sm",
              "rawValue": "@media screen and (min-width: 40em)",
              "type": "at-rule",
              "value": "sm",
            },
          ],
          "entry": {
            "cond": "sm",
            "prop": "color",
            "value": "yellow",
          },
          "hash": "color]___[value:yellow]___[cond:sm",
          "layer": undefined,
          "result": {
            ".sm\\\\:text_yellow": {
              "@media screen and (min-width: 40em)": {
                "color": "yellow",
              },
            },
          },
        },
        {
          "className": "sm\\\\:bg_red",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 40em)",
              "raw": "sm",
              "rawValue": "@media screen and (min-width: 40em)",
              "type": "at-rule",
              "value": "sm",
            },
          ],
          "entry": {
            "cond": "sm",
            "prop": "backgroundColor",
            "value": "red",
          },
          "hash": "backgroundColor]___[value:red]___[cond:sm",
          "layer": undefined,
          "result": {
            ".sm\\\\:bg_red": {
              "@media screen and (min-width: 40em)": {
                "backgroundColor": "red",
              },
            },
          },
        },
        {
          "className": "sm\\\\:hover\\\\:bg_green",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 40em)",
              "raw": "sm",
              "rawValue": "@media screen and (min-width: 40em)",
              "type": "at-rule",
              "value": "sm",
            },
          ],
          "entry": {
            "cond": "sm<___>_hover",
            "prop": "backgroundColor",
            "value": "green",
          },
          "hash": "backgroundColor]___[value:green]___[cond:sm<___>_hover",
          "layer": undefined,
          "result": {
            ".sm\\\\:hover\\\\:bg_green": {
              "&:is(:hover, [data-hover])": {
                "@media screen and (min-width: 40em)": {
                  "backgroundColor": "green",
                },
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:text_green",
          "conditions": [
            {
              "raw": "&[data-attr='test']",
              "type": "self-nesting",
              "value": "&[data-attr='test']",
            },
          ],
          "entry": {
            "cond": "&[data-attr='test']",
            "prop": "color",
            "value": "green",
          },
          "hash": "color]___[value:green]___[cond:&[data-attr='test']",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:text_green": {
              "&[data-attr='test']": {
                "color": "green",
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:text_purple",
          "conditions": [
            {
              "raw": "&[data-attr='test']",
              "type": "self-nesting",
              "value": "&[data-attr='test']",
            },
            {
              "raw": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
              "type": "self-nesting",
              "value": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
            },
          ],
          "entry": {
            "cond": "&[data-attr='test']<___>_expanded",
            "prop": "color",
            "value": "purple",
          },
          "hash": "color]___[value:purple]___[cond:&[data-attr='test']<___>_expanded",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:text_purple": {
              "&[data-attr='test']": {
                "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])": {
                  "color": "purple",
                },
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:text_cyan",
          "conditions": [
            {
              "raw": "&[data-attr='test']",
              "type": "self-nesting",
              "value": "&[data-attr='test']",
            },
            {
              "raw": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
              "type": "self-nesting",
              "value": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
            },
            {
              "raw": ".target &",
              "type": "parent-nesting",
              "value": ".target &",
            },
          ],
          "entry": {
            "cond": "&[data-attr='test']<___>_expanded<___>.target &",
            "prop": "color",
            "value": "cyan",
          },
          "hash": "color]___[value:cyan]___[cond:&[data-attr='test']<___>_expanded<___>.target &",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:text_cyan": {
              "&[data-attr='test']": {
                "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])": {
                  ".target &": {
                    "color": "cyan",
                  },
                },
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:open\\\\:text_orange",
          "conditions": [
            {
              "raw": "&[data-attr='test']",
              "type": "self-nesting",
              "value": "&[data-attr='test']",
            },
            {
              "raw": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
              "type": "self-nesting",
              "value": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
            },
            {
              "raw": "&:is([open], [data-open], [data-state=\\"open\\"])",
              "type": "self-nesting",
              "value": "&:is([open], [data-open], [data-state=\\"open\\"])",
            },
            {
              "raw": ".target &",
              "type": "parent-nesting",
              "value": ".target &",
            },
          ],
          "entry": {
            "cond": "&[data-attr='test']<___>_expanded<___>.target &<___>_open",
            "prop": "color",
            "value": "orange",
          },
          "hash": "color]___[value:orange]___[cond:&[data-attr='test']<___>_expanded<___>.target &<___>_open",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:open\\\\:text_orange": {
              "&[data-attr='test']": {
                "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])": {
                  "&:is([open], [data-open], [data-state=\\"open\\"])": {
                    ".target &": {
                      "color": "orange",
                    },
                  },
                },
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:xl\\\\:text_pink",
          "conditions": [
            {
              "raw": "&[data-attr='test']",
              "type": "self-nesting",
              "value": "&[data-attr='test']",
            },
            {
              "raw": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
              "type": "self-nesting",
              "value": "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])",
            },
            {
              "raw": ".target &",
              "type": "parent-nesting",
              "value": ".target &",
            },
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 80em)",
              "raw": "xl",
              "rawValue": "@media screen and (min-width: 80em)",
              "type": "at-rule",
              "value": "xl",
            },
          ],
          "entry": {
            "cond": "&[data-attr='test']<___>_expanded<___>.target &<___>xl",
            "prop": "color",
            "value": "pink",
          },
          "hash": "color]___[value:pink]___[cond:&[data-attr='test']<___>_expanded<___>.target &<___>xl",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-attr\\\\=\\\\'test\\\\'\\\\]\\\\]\\\\:expanded\\\\:\\\\[\\\\.target_\\\\&\\\\]\\\\:xl\\\\:text_pink": {
              "&[data-attr='test']": {
                "&:is([aria-expanded=true], [data-expanded], [data-state=\\"expanded\\"])": {
                  ".target &": {
                    "@media screen and (min-width: 80em)": {
                      "color": "pink",
                    },
                  },
                },
              },
            },
          },
        },
      }
    `,
    )
  })

  test('recipe', () => {
    const result = recipe('buttonStyle', { size: { base: 'sm', md: 'md' } })

    expect(result.base).toMatchInlineSnapshot(`
      Set {
        {
          "className": "buttonStyle",
          "details": [
            {
              "conditions": undefined,
              "entry": {
                "prop": "display",
                "recipe": "buttonStyle",
                "value": "inline-flex",
              },
              "hash": "display]___[value:inline-flex]___[recipe:buttonStyle",
              "result": {
                "display": "inline-flex",
              },
            },
            {
              "conditions": undefined,
              "entry": {
                "prop": "alignItems",
                "recipe": "buttonStyle",
                "value": "center",
              },
              "hash": "alignItems]___[value:center]___[recipe:buttonStyle",
              "result": {
                "alignItems": "center",
              },
            },
            {
              "conditions": undefined,
              "entry": {
                "prop": "justifyContent",
                "recipe": "buttonStyle",
                "value": "center",
              },
              "hash": "justifyContent]___[value:center]___[recipe:buttonStyle",
              "result": {
                "justifyContent": "center",
              },
            },
            {
              "conditions": [
                {
                  "raw": "&:is(:hover, [data-hover])",
                  "type": "self-nesting",
                  "value": "&:is(:hover, [data-hover])",
                },
              ],
              "entry": {
                "cond": "_hover",
                "prop": "backgroundColor",
                "recipe": "buttonStyle",
                "value": "red.200",
              },
              "hash": "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
              "result": {
                "backgroundColor": "var(--colors-red-200)",
              },
            },
          ],
          "hashSet": Set {
            "display]___[value:inline-flex]___[recipe:buttonStyle",
            "alignItems]___[value:center]___[recipe:buttonStyle",
            "justifyContent]___[value:center]___[recipe:buttonStyle",
            "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
          },
          "recipe": "buttonStyle",
          "result": {
            ".buttonStyle": {
              "&:is(:hover, [data-hover])": {
                "backgroundColor": "var(--colors-red-200)",
              },
              "alignItems": "center",
              "display": "inline-flex",
              "justifyContent": "center",
            },
          },
          "slot": undefined,
        },
      }
    `)

    expect(result.variants).toMatchInlineSnapshot(`
      Set {
        {
          "className": "buttonStyle--size_sm",
          "conditions": undefined,
          "entry": {
            "prop": "size",
            "recipe": "buttonStyle",
            "value": "sm",
          },
          "hash": "size]___[value:sm]___[recipe:buttonStyle",
          "layer": undefined,
          "result": {
            ".buttonStyle--size_sm": {
              "height": "2.5rem",
              "minWidth": "2.5rem",
              "padding": "0 0.5rem",
            },
          },
        },
        {
          "className": "md\\\\:buttonStyle--size_md",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 48em)",
              "raw": "md",
              "rawValue": "@media screen and (min-width: 48em)",
              "type": "at-rule",
              "value": "md",
            },
          ],
          "entry": {
            "cond": "md",
            "prop": "size",
            "recipe": "buttonStyle",
            "value": "md",
          },
          "hash": "size]___[value:md]___[cond:md]___[recipe:buttonStyle",
          "layer": undefined,
          "result": {
            ".md\\\\:buttonStyle--size_md": {
              "@media screen and (min-width: 48em)": {
                "height": "3rem",
                "minWidth": "3rem",
                "padding": "0 0.75rem",
              },
            },
          },
        },
        {
          "className": "buttonStyle--variant_solid",
          "conditions": undefined,
          "entry": {
            "prop": "variant",
            "recipe": "buttonStyle",
            "value": "solid",
          },
          "hash": "variant]___[value:solid]___[recipe:buttonStyle",
          "layer": undefined,
          "result": {
            ".buttonStyle--variant_solid": {
              "&": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "darkblue",
                },
                "&[data-disabled]": {
                  "backgroundColor": "gray",
                  "color": "var(--colors-black)",
                },
              },
              "backgroundColor": "blue",
              "color": "var(--colors-white)",
            },
          },
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
        {
          "className": "d_inline-flex",
          "conditions": undefined,
          "entry": {
            "prop": "display",
            "value": "inline-flex",
          },
          "hash": "display]___[value:inline-flex",
          "layer": undefined,
          "result": {
            ".d_inline-flex": {
              "display": "inline-flex",
            },
          },
        },
        {
          "className": "items_center",
          "conditions": undefined,
          "entry": {
            "prop": "alignItems",
            "value": "center",
          },
          "hash": "alignItems]___[value:center",
          "layer": undefined,
          "result": {
            ".items_center": {
              "alignItems": "center",
            },
          },
        },
        {
          "className": "justify_center",
          "conditions": undefined,
          "entry": {
            "prop": "justifyContent",
            "value": "center",
          },
          "hash": "justifyContent]___[value:center",
          "layer": undefined,
          "result": {
            ".justify_center": {
              "justifyContent": "center",
            },
          },
        },
        {
          "className": "textStyle_headline\\\\.h1",
          "conditions": undefined,
          "entry": {
            "prop": "textStyle",
            "value": "headline.h1",
          },
          "hash": "textStyle]___[value:headline.h1",
          "layer": "compositions",
          "result": {
            ".textStyle_headline\\\\.h1": {
              "fontSize": "2rem",
              "fontWeight": "var(--font-weights-bold)",
            },
          },
        },
        {
          "className": "h_2\\\\.5rem",
          "conditions": undefined,
          "entry": {
            "prop": "height",
            "value": "2.5rem",
          },
          "hash": "height]___[value:2.5rem",
          "layer": undefined,
          "result": {
            ".h_2\\\\.5rem": {
              "height": "2.5rem",
            },
          },
        },
        {
          "className": "min-w_2\\\\.5rem",
          "conditions": undefined,
          "entry": {
            "prop": "minWidth",
            "value": "2.5rem",
          },
          "hash": "minWidth]___[value:2.5rem",
          "layer": undefined,
          "result": {
            ".min-w_2\\\\.5rem": {
              "minWidth": "2.5rem",
            },
          },
        },
        {
          "className": "p_0_0\\\\.5rem",
          "conditions": undefined,
          "entry": {
            "prop": "padding",
            "value": "0 0.5rem",
          },
          "hash": "padding]___[value:0 0.5rem",
          "layer": undefined,
          "result": {
            ".p_0_0\\\\.5rem": {
              "padding": "0 0.5rem",
            },
          },
        },
        {
          "className": "h_3rem",
          "conditions": undefined,
          "entry": {
            "prop": "height",
            "value": "3rem",
          },
          "hash": "height]___[value:3rem",
          "layer": undefined,
          "result": {
            ".h_3rem": {
              "height": "3rem",
            },
          },
        },
        {
          "className": "min-w_3rem",
          "conditions": undefined,
          "entry": {
            "prop": "minWidth",
            "value": "3rem",
          },
          "hash": "minWidth]___[value:3rem",
          "layer": undefined,
          "result": {
            ".min-w_3rem": {
              "minWidth": "3rem",
            },
          },
        },
        {
          "className": "p_0_0\\\\.75rem",
          "conditions": undefined,
          "entry": {
            "prop": "padding",
            "value": "0 0.75rem",
          },
          "hash": "padding]___[value:0 0.75rem",
          "layer": undefined,
          "result": {
            ".p_0_0\\\\.75rem": {
              "padding": "0 0.75rem",
            },
          },
        },
        {
          "className": "bg_blue",
          "conditions": undefined,
          "entry": {
            "prop": "backgroundColor",
            "value": "blue",
          },
          "hash": "backgroundColor]___[value:blue",
          "layer": undefined,
          "result": {
            ".bg_blue": {
              "backgroundColor": "blue",
            },
          },
        },
        {
          "className": "text_white",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "white",
          },
          "hash": "color]___[value:white",
          "layer": undefined,
          "result": {
            ".text_white": {
              "color": "var(--colors-white)",
            },
          },
        },
        {
          "className": "hover\\\\:bg_darkblue",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
          ],
          "entry": {
            "cond": "_hover",
            "prop": "backgroundColor",
            "value": "darkblue",
          },
          "hash": "backgroundColor]___[value:darkblue]___[cond:_hover",
          "layer": undefined,
          "result": {
            ".hover\\\\:bg_darkblue": {
              "&:is(:hover, [data-hover])": {
                "backgroundColor": "darkblue",
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_gray",
          "conditions": [
            {
              "raw": "&[data-disabled]",
              "type": "self-nesting",
              "value": "&[data-disabled]",
            },
          ],
          "entry": {
            "cond": "&[data-disabled]",
            "prop": "backgroundColor",
            "value": "gray",
          },
          "hash": "backgroundColor]___[value:gray]___[cond:&[data-disabled]",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_gray": {
              "&[data-disabled]": {
                "backgroundColor": "gray",
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_black",
          "conditions": [
            {
              "raw": "&[data-disabled]",
              "type": "self-nesting",
              "value": "&[data-disabled]",
            },
          ],
          "entry": {
            "cond": "&[data-disabled]",
            "prop": "color",
            "value": "black",
          },
          "hash": "color]___[value:black]___[cond:&[data-disabled]",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_black": {
              "&[data-disabled]": {
                "color": "var(--colors-black)",
              },
            },
          },
        },
        {
          "className": "bg_transparent",
          "conditions": undefined,
          "entry": {
            "prop": "backgroundColor",
            "value": "transparent",
          },
          "hash": "backgroundColor]___[value:transparent",
          "layer": undefined,
          "result": {
            ".bg_transparent": {
              "backgroundColor": "var(--colors-transparent)",
            },
          },
        },
        {
          "className": "border_1px_solid_blue",
          "conditions": undefined,
          "entry": {
            "prop": "border",
            "value": "1px solid blue",
          },
          "hash": "border]___[value:1px solid blue",
          "layer": undefined,
          "result": {
            ".border_1px_solid_blue": {
              "border": "1px solid blue",
            },
          },
        },
        {
          "className": "text_blue",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "blue",
          },
          "hash": "color]___[value:blue",
          "layer": undefined,
          "result": {
            ".text_blue": {
              "color": "blue",
            },
          },
        },
        {
          "className": "hover\\\\:bg_blue",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
          ],
          "entry": {
            "cond": "_hover",
            "prop": "backgroundColor",
            "value": "blue",
          },
          "hash": "backgroundColor]___[value:blue]___[cond:_hover",
          "layer": undefined,
          "result": {
            ".hover\\\\:bg_blue": {
              "&:is(:hover, [data-hover])": {
                "backgroundColor": "blue",
              },
            },
          },
        },
        {
          "className": "hover\\\\:text_white",
          "conditions": [
            {
              "raw": "&:is(:hover, [data-hover])",
              "type": "self-nesting",
              "value": "&:is(:hover, [data-hover])",
            },
          ],
          "entry": {
            "cond": "_hover",
            "prop": "color",
            "value": "white",
          },
          "hash": "color]___[value:white]___[cond:_hover",
          "layer": undefined,
          "result": {
            ".hover\\\\:text_white": {
              "&:is(:hover, [data-hover])": {
                "color": "var(--colors-white)",
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_transparent",
          "conditions": [
            {
              "raw": "&[data-disabled]",
              "type": "self-nesting",
              "value": "&[data-disabled]",
            },
          ],
          "entry": {
            "cond": "&[data-disabled]",
            "prop": "backgroundColor",
            "value": "transparent",
          },
          "hash": "backgroundColor]___[value:transparent]___[cond:&[data-disabled]",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:bg_transparent": {
              "&[data-disabled]": {
                "backgroundColor": "var(--colors-transparent)",
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:border_1px_solid_gray",
          "conditions": [
            {
              "raw": "&[data-disabled]",
              "type": "self-nesting",
              "value": "&[data-disabled]",
            },
          ],
          "entry": {
            "cond": "&[data-disabled]",
            "prop": "border",
            "value": "1px solid gray",
          },
          "hash": "border]___[value:1px solid gray]___[cond:&[data-disabled]",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:border_1px_solid_gray": {
              "&[data-disabled]": {
                "border": "1px solid gray",
              },
            },
          },
        },
        {
          "className": "\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_gray",
          "conditions": [
            {
              "raw": "&[data-disabled]",
              "type": "self-nesting",
              "value": "&[data-disabled]",
            },
          ],
          "entry": {
            "cond": "&[data-disabled]",
            "prop": "color",
            "value": "gray",
          },
          "hash": "color]___[value:gray]___[cond:&[data-disabled]",
          "layer": undefined,
          "result": {
            ".\\\\[\\\\&\\\\[data-disabled\\\\]\\\\]\\\\:text_gray": {
              "&[data-disabled]": {
                "color": "gray",
              },
            },
          },
        },
      }
    `)
  })

  test('slot recipe', () => {
    const result = recipe('checkbox', { size: { base: 'sm', md: 'md' } })

    expect(result.base).toMatchInlineSnapshot(`
      {
        "control": Set {
          {
            "className": "checkbox__control",
            "details": [
              {
                "conditions": undefined,
                "entry": {
                  "prop": "borderWidth",
                  "recipe": "checkbox",
                  "slot": "control",
                  "value": "1px",
                },
                "hash": "borderWidth]___[value:1px]___[recipe:checkbox]___[slot:control",
                "result": {
                  "borderWidth": "1px",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "borderRadius",
                  "recipe": "checkbox",
                  "slot": "control",
                  "value": "sm",
                },
                "hash": "borderRadius]___[value:sm]___[recipe:checkbox]___[slot:control",
                "result": {
                  "borderRadius": "var(--radii-sm)",
                },
              },
            ],
            "hashSet": Set {
              "borderWidth]___[value:1px]___[recipe:checkbox]___[slot:control",
              "borderRadius]___[value:sm]___[recipe:checkbox]___[slot:control",
            },
            "recipe": "checkbox",
            "result": {
              ".checkbox__control": {
                "borderRadius": "var(--radii-sm)",
                "borderWidth": "1px",
              },
            },
            "slot": "control",
          },
        },
        "label": Set {
          {
            "className": "checkbox__label",
            "details": [
              {
                "conditions": undefined,
                "entry": {
                  "prop": "marginInlineStart",
                  "recipe": "checkbox",
                  "slot": "label",
                  "value": 2,
                },
                "hash": "marginInlineStart]___[value:2]___[recipe:checkbox]___[slot:label",
                "result": {
                  "marginInlineStart": "var(--spacing-2)",
                },
              },
            ],
            "hashSet": Set {
              "marginInlineStart]___[value:2]___[recipe:checkbox]___[slot:label",
            },
            "recipe": "checkbox",
            "result": {
              ".checkbox__label": {
                "marginInlineStart": "var(--spacing-2)",
              },
            },
            "slot": "label",
          },
        },
        "root": Set {
          {
            "className": "checkbox__root",
            "details": [
              {
                "conditions": undefined,
                "entry": {
                  "prop": "display",
                  "recipe": "checkbox",
                  "slot": "root",
                  "value": "flex",
                },
                "hash": "display]___[value:flex]___[recipe:checkbox]___[slot:root",
                "result": {
                  "display": "flex",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "alignItems",
                  "recipe": "checkbox",
                  "slot": "root",
                  "value": "center",
                },
                "hash": "alignItems]___[value:center]___[recipe:checkbox]___[slot:root",
                "result": {
                  "alignItems": "center",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "gap",
                  "recipe": "checkbox",
                  "slot": "root",
                  "value": 2,
                },
                "hash": "gap]___[value:2]___[recipe:checkbox]___[slot:root",
                "result": {
                  "gap": "var(--spacing-2)",
                },
              },
            ],
            "hashSet": Set {
              "display]___[value:flex]___[recipe:checkbox]___[slot:root",
              "alignItems]___[value:center]___[recipe:checkbox]___[slot:root",
              "gap]___[value:2]___[recipe:checkbox]___[slot:root",
            },
            "recipe": "checkbox",
            "result": {
              ".checkbox__root": {
                "alignItems": "center",
                "display": "flex",
                "gap": "var(--spacing-2)",
              },
            },
            "slot": "root",
          },
        },
      }
    `)
    expect(result.variants).toMatchInlineSnapshot(`
      Set {
        {
          "className": "checkbox__root--size_sm",
          "conditions": undefined,
          "entry": {
            "prop": "size",
            "recipe": "checkbox",
            "slot": "root",
            "value": "sm",
          },
          "hash": "size]___[value:sm]___[recipe:checkbox]___[slot:root",
          "layer": undefined,
          "result": {
            ".checkbox__root--size_sm": {},
          },
        },
        {
          "className": "checkbox__control--size_sm",
          "conditions": undefined,
          "entry": {
            "prop": "size",
            "recipe": "checkbox",
            "slot": "control",
            "value": "sm",
          },
          "hash": "size]___[value:sm]___[recipe:checkbox]___[slot:control",
          "layer": undefined,
          "result": {
            ".checkbox__control--size_sm": {
              "fontSize": "2rem",
              "fontWeight": "var(--font-weights-bold)",
              "height": "var(--sizes-8)",
              "width": "var(--sizes-8)",
            },
          },
        },
        {
          "className": "checkbox__label--size_sm",
          "conditions": undefined,
          "entry": {
            "prop": "size",
            "recipe": "checkbox",
            "slot": "label",
            "value": "sm",
          },
          "hash": "size]___[value:sm]___[recipe:checkbox]___[slot:label",
          "layer": undefined,
          "result": {
            ".checkbox__label--size_sm": {
              "fontSize": "var(--font-sizes-sm)",
            },
          },
        },
        {
          "className": "md\\\\:checkbox__root--size_md",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 48em)",
              "raw": "md",
              "rawValue": "@media screen and (min-width: 48em)",
              "type": "at-rule",
              "value": "md",
            },
          ],
          "entry": {
            "cond": "md",
            "prop": "size",
            "recipe": "checkbox",
            "slot": "root",
            "value": "md",
          },
          "hash": "size]___[value:md]___[cond:md]___[recipe:checkbox]___[slot:root",
          "layer": undefined,
          "result": {
            ".md\\\\:checkbox__root--size_md": {
              "@media screen and (min-width: 48em)": {},
            },
          },
        },
        {
          "className": "md\\\\:checkbox__control--size_md",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 48em)",
              "raw": "md",
              "rawValue": "@media screen and (min-width: 48em)",
              "type": "at-rule",
              "value": "md",
            },
          ],
          "entry": {
            "cond": "md",
            "prop": "size",
            "recipe": "checkbox",
            "slot": "control",
            "value": "md",
          },
          "hash": "size]___[value:md]___[cond:md]___[recipe:checkbox]___[slot:control",
          "layer": undefined,
          "result": {
            ".md\\\\:checkbox__control--size_md": {
              "@media screen and (min-width: 48em)": {
                "height": "var(--sizes-10)",
                "width": "var(--sizes-10)",
              },
            },
          },
        },
        {
          "className": "md\\\\:checkbox__label--size_md",
          "conditions": [
            {
              "name": "breakpoint",
              "params": "screen and (min-width: 48em)",
              "raw": "md",
              "rawValue": "@media screen and (min-width: 48em)",
              "type": "at-rule",
              "value": "md",
            },
          ],
          "entry": {
            "cond": "md",
            "prop": "size",
            "recipe": "checkbox",
            "slot": "label",
            "value": "md",
          },
          "hash": "size]___[value:md]___[cond:md]___[recipe:checkbox]___[slot:label",
          "layer": undefined,
          "result": {
            ".md\\\\:checkbox__label--size_md": {
              "@media screen and (min-width: 48em)": {
                "fontSize": "var(--font-sizes-md)",
              },
            },
          },
        },
      }
    `)
  })

  test('sva', () => {
    // packages/fixture/src/slot-recipes.ts
    const checkbox = sva({
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
        {
          "className": "d_flex",
          "conditions": undefined,
          "entry": {
            "prop": "display",
            "value": "flex",
          },
          "hash": "display]___[value:flex",
          "layer": undefined,
          "result": {
            ".d_flex": {
              "display": "flex",
            },
          },
        },
        {
          "className": "items_center",
          "conditions": undefined,
          "entry": {
            "prop": "alignItems",
            "value": "center",
          },
          "hash": "alignItems]___[value:center",
          "layer": undefined,
          "result": {
            ".items_center": {
              "alignItems": "center",
            },
          },
        },
        {
          "className": "gap_2",
          "conditions": undefined,
          "entry": {
            "prop": "gap",
            "value": 2,
          },
          "hash": "gap]___[value:2",
          "layer": undefined,
          "result": {
            ".gap_2": {
              "gap": "var(--spacing-2)",
            },
          },
        },
        {
          "className": "border-w_1px",
          "conditions": undefined,
          "entry": {
            "prop": "borderWidth",
            "value": "1px",
          },
          "hash": "borderWidth]___[value:1px",
          "layer": undefined,
          "result": {
            ".border-w_1px": {
              "borderWidth": "1px",
            },
          },
        },
        {
          "className": "rounded_sm",
          "conditions": undefined,
          "entry": {
            "prop": "borderRadius",
            "value": "sm",
          },
          "hash": "borderRadius]___[value:sm",
          "layer": undefined,
          "result": {
            ".rounded_sm": {
              "borderRadius": "var(--radii-sm)",
            },
          },
        },
        {
          "className": "w_8",
          "conditions": undefined,
          "entry": {
            "prop": "width",
            "value": 8,
          },
          "hash": "width]___[value:8",
          "layer": undefined,
          "result": {
            ".w_8": {
              "width": "var(--sizes-8)",
            },
          },
        },
        {
          "className": "h_8",
          "conditions": undefined,
          "entry": {
            "prop": "height",
            "value": 8,
          },
          "hash": "height]___[value:8",
          "layer": undefined,
          "result": {
            ".h_8": {
              "height": "var(--sizes-8)",
            },
          },
        },
        {
          "className": "w_10",
          "conditions": undefined,
          "entry": {
            "prop": "width",
            "value": 10,
          },
          "hash": "width]___[value:10",
          "layer": undefined,
          "result": {
            ".w_10": {
              "width": "var(--sizes-10)",
            },
          },
        },
        {
          "className": "h_10",
          "conditions": undefined,
          "entry": {
            "prop": "height",
            "value": 10,
          },
          "hash": "height]___[value:10",
          "layer": undefined,
          "result": {
            ".h_10": {
              "height": "var(--sizes-10)",
            },
          },
        },
        {
          "className": "w_12",
          "conditions": undefined,
          "entry": {
            "prop": "width",
            "value": 12,
          },
          "hash": "width]___[value:12",
          "layer": undefined,
          "result": {
            ".w_12": {
              "width": "var(--sizes-12)",
            },
          },
        },
        {
          "className": "h_12",
          "conditions": undefined,
          "entry": {
            "prop": "height",
            "value": 12,
          },
          "hash": "height]___[value:12",
          "layer": undefined,
          "result": {
            ".h_12": {
              "height": "var(--sizes-12)",
            },
          },
        },
        {
          "className": "ms_2",
          "conditions": undefined,
          "entry": {
            "prop": "marginInlineStart",
            "value": 2,
          },
          "hash": "marginInlineStart]___[value:2",
          "layer": undefined,
          "result": {
            ".ms_2": {
              "marginInlineStart": "var(--spacing-2)",
            },
          },
        },
        {
          "className": "fs_sm",
          "conditions": undefined,
          "entry": {
            "prop": "fontSize",
            "value": "sm",
          },
          "hash": "fontSize]___[value:sm",
          "layer": undefined,
          "result": {
            ".fs_sm": {
              "fontSize": "var(--font-sizes-sm)",
            },
          },
        },
        {
          "className": "fs_md",
          "conditions": undefined,
          "entry": {
            "prop": "fontSize",
            "value": "md",
          },
          "hash": "fontSize]___[value:md",
          "layer": undefined,
          "result": {
            ".fs_md": {
              "fontSize": "var(--font-sizes-md)",
            },
          },
        },
        {
          "className": "fs_lg",
          "conditions": undefined,
          "entry": {
            "prop": "fontSize",
            "value": "lg",
          },
          "hash": "fontSize]___[value:lg",
          "layer": undefined,
          "result": {
            ".fs_lg": {
              "fontSize": "var(--font-sizes-lg)",
            },
          },
        },
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

  test('fromJSON', () => {
    const ctx = createGeneratorContext()
    const encoder = ctx.encoder
    const decoder = ctx.decoder

    encoder.fromJSON({
      schemaVersion: 'x',
      styles: { atomic: ['color]___[value:red', 'color]___[value:blue'] },
    })

    expect(decoder.collect(encoder).atomic).toMatchInlineSnapshot(`
      Set {
        {
          "className": "text_red",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "red",
          },
          "hash": "color]___[value:red",
          "layer": undefined,
          "result": {
            ".text_red": {
              "color": "red",
            },
          },
        },
        {
          "className": "text_blue",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "blue",
          },
          "hash": "color]___[value:blue",
          "layer": undefined,
          "result": {
            ".text_blue": {
              "color": "blue",
            },
          },
        },
      }
    `)

    encoder.fromJSON({
      schemaVersion: 'x',
      styles: { recipes: { buttonStyle: ['variant]___[value:solid'] } },
    })

    expect(decoder.collect(encoder).recipes).toMatchInlineSnapshot(`
      Map {
        "buttonStyle" => Set {
          {
            "className": "variant_solid",
            "conditions": undefined,
            "entry": {
              "prop": "variant",
              "value": "solid",
            },
            "hash": "variant]___[value:solid",
            "layer": undefined,
            "result": {
              ".variant_solid": {
                "variant": "solid",
              },
            },
          },
        },
      }
    `)

    expect(decoder.collect(encoder).recipes_base).toMatchInlineSnapshot(`
      Map {
        "buttonStyle" => Set {
          {
            "className": "buttonStyle",
            "details": [
              {
                "conditions": undefined,
                "entry": {
                  "prop": "display",
                  "recipe": "buttonStyle",
                  "value": "inline-flex",
                },
                "hash": "display]___[value:inline-flex]___[recipe:buttonStyle",
                "result": {
                  "display": "inline-flex",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "alignItems",
                  "recipe": "buttonStyle",
                  "value": "center",
                },
                "hash": "alignItems]___[value:center]___[recipe:buttonStyle",
                "result": {
                  "alignItems": "center",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "justifyContent",
                  "recipe": "buttonStyle",
                  "value": "center",
                },
                "hash": "justifyContent]___[value:center]___[recipe:buttonStyle",
                "result": {
                  "justifyContent": "center",
                },
              },
              {
                "conditions": [
                  {
                    "raw": "&:is(:hover, [data-hover])",
                    "type": "self-nesting",
                    "value": "&:is(:hover, [data-hover])",
                  },
                ],
                "entry": {
                  "cond": "_hover",
                  "prop": "backgroundColor",
                  "recipe": "buttonStyle",
                  "value": "red.200",
                },
                "hash": "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
                "result": {
                  "backgroundColor": "var(--colors-red-200)",
                },
              },
            ],
            "hashSet": Set {
              "display]___[value:inline-flex]___[recipe:buttonStyle",
              "alignItems]___[value:center]___[recipe:buttonStyle",
              "justifyContent]___[value:center]___[recipe:buttonStyle",
              "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
            },
            "recipe": "buttonStyle",
            "result": {
              ".buttonStyle": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "var(--colors-red-200)",
                },
                "alignItems": "center",
                "display": "inline-flex",
                "justifyContent": "center",
              },
            },
            "slot": undefined,
          },
          {
            "className": "buttonStyle",
            "details": [
              {
                "conditions": undefined,
                "entry": {
                  "prop": "display",
                  "recipe": "buttonStyle",
                  "value": "inline-flex",
                },
                "hash": "display]___[value:inline-flex]___[recipe:buttonStyle",
                "result": {
                  "display": "inline-flex",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "alignItems",
                  "recipe": "buttonStyle",
                  "value": "center",
                },
                "hash": "alignItems]___[value:center]___[recipe:buttonStyle",
                "result": {
                  "alignItems": "center",
                },
              },
              {
                "conditions": undefined,
                "entry": {
                  "prop": "justifyContent",
                  "recipe": "buttonStyle",
                  "value": "center",
                },
                "hash": "justifyContent]___[value:center]___[recipe:buttonStyle",
                "result": {
                  "justifyContent": "center",
                },
              },
              {
                "conditions": [
                  {
                    "raw": "&:is(:hover, [data-hover])",
                    "type": "self-nesting",
                    "value": "&:is(:hover, [data-hover])",
                  },
                ],
                "entry": {
                  "cond": "_hover",
                  "prop": "backgroundColor",
                  "recipe": "buttonStyle",
                  "value": "red.200",
                },
                "hash": "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
                "result": {
                  "backgroundColor": "var(--colors-red-200)",
                },
              },
            ],
            "hashSet": Set {
              "display]___[value:inline-flex]___[recipe:buttonStyle",
              "alignItems]___[value:center]___[recipe:buttonStyle",
              "justifyContent]___[value:center]___[recipe:buttonStyle",
              "backgroundColor]___[value:red.200]___[cond:_hover]___[recipe:buttonStyle",
            },
            "recipe": "buttonStyle",
            "result": {
              ".buttonStyle": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "var(--colors-red-200)",
                },
                "alignItems": "center",
                "display": "inline-flex",
                "justifyContent": "center",
              },
            },
            "slot": undefined,
          },
        },
      }
    `)

    const _encoder = encoder.clone().fromJSON({
      schemaVersion: 'x',
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
    })

    const { results } = decoder.clone().collect(_encoder)
    expect(results).toMatchInlineSnapshot(`
      {
        "atomic": Set {
          {
            "className": "d_none",
            "conditions": undefined,
            "entry": {
              "prop": "display",
              "value": "none",
            },
            "hash": "display]___[value:none",
            "layer": undefined,
            "result": {
              ".d_none": {
                "display": "none",
              },
            },
          },
          {
            "className": "h_100\\\\%",
            "conditions": undefined,
            "entry": {
              "prop": "height",
              "value": "100%",
            },
            "hash": "height]___[value:100%",
            "layer": undefined,
            "result": {
              ".h_100\\\\%": {
                "height": "100%",
              },
            },
          },
          {
            "className": "transition_all_\\\\.3s_ease-in-out",
            "conditions": undefined,
            "entry": {
              "prop": "transition",
              "value": "all .3s ease-in-out",
            },
            "hash": "transition]___[value:all .3s ease-in-out",
            "layer": undefined,
            "result": {
              ".transition_all_\\\\.3s_ease-in-out": {
                "transition": "all .3s ease-in-out",
              },
            },
          },
          {
            "className": "opacity_0",
            "conditions": undefined,
            "entry": {
              "prop": "opacity",
              "value": "0 !important",
            },
            "hash": "opacity]___[value:0 !important",
            "layer": undefined,
            "result": {
              ".opacity_0\\\\!": {
                "opacity": "0 !important",
              },
            },
          },
          {
            "className": "opacity_1",
            "conditions": undefined,
            "entry": {
              "prop": "opacity",
              "value": 1,
            },
            "hash": "opacity]___[value:1",
            "layer": undefined,
            "result": {
              ".opacity_1": {
                "opacity": 1,
              },
            },
          },
          {
            "className": "h_10px",
            "conditions": undefined,
            "entry": {
              "prop": "height",
              "value": "10px",
            },
            "hash": "height]___[value:10px",
            "layer": undefined,
            "result": {
              ".h_10px": {
                "height": "10px",
              },
            },
          },
          {
            "className": "bg-gradient_to-b",
            "conditions": undefined,
            "entry": {
              "prop": "backgroundGradient",
              "value": "to-b",
            },
            "hash": "backgroundGradient]___[value:to-b",
            "layer": undefined,
            "result": {
              ".bg-gradient_to-b": {
                "--gradient": "var(--gradient-via-stops, var(--gradient-stops))",
                "--gradient-stops": "var(--gradient-from), var(--gradient-to)",
                "backgroundImage": "linear-gradient(to bottom, var(--gradient))",
              },
            },
          },
          {
            "className": "from_rgb\\\\(200_200_200_\\\\/_\\\\.4\\\\)",
            "conditions": undefined,
            "entry": {
              "prop": "gradientFrom",
              "value": "rgb(200 200 200 / .4)",
            },
            "hash": "gradientFrom]___[value:rgb(200 200 200 / .4)",
            "layer": undefined,
            "result": {
              ".from_rgb\\\\(200_200_200_\\\\/_\\\\.4\\\\)": {
                "--gradient-from": "rgb(200 200 200 / .4)",
              },
            },
          },
        },
        "recipes": Map {
          "checkbox" => Set {
            {
              "className": "checkbox__root--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "root",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:container]___[slot:root",
              "layer": undefined,
              "result": {
                ".checkbox__root--size_md": {},
              },
            },
            {
              "className": "checkbox__control--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "control",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:container]___[slot:control",
              "layer": undefined,
              "result": {
                ".checkbox__control--size_md": {
                  "height": "var(--sizes-10)",
                  "width": "var(--sizes-10)",
                },
              },
            },
            {
              "className": "checkbox__label--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "label",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:container]___[slot:label",
              "layer": undefined,
              "result": {
                ".checkbox__label--size_md": {
                  "fontSize": "var(--font-sizes-md)",
                },
              },
            },
            {
              "className": "checkbox__root--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "root",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:control]___[slot:root",
              "layer": undefined,
              "result": {
                ".checkbox__root--size_md": {},
              },
            },
            {
              "className": "checkbox__control--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "control",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:control]___[slot:control",
              "layer": undefined,
              "result": {
                ".checkbox__control--size_md": {
                  "height": "var(--sizes-10)",
                  "width": "var(--sizes-10)",
                },
              },
            },
            {
              "className": "checkbox__label--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "label",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:control]___[slot:label",
              "layer": undefined,
              "result": {
                ".checkbox__label--size_md": {
                  "fontSize": "var(--font-sizes-md)",
                },
              },
            },
            {
              "className": "checkbox__root--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "root",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:label]___[slot:root",
              "layer": undefined,
              "result": {
                ".checkbox__root--size_md": {},
              },
            },
            {
              "className": "checkbox__control--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "control",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:label]___[slot:control",
              "layer": undefined,
              "result": {
                ".checkbox__control--size_md": {
                  "height": "var(--sizes-10)",
                  "width": "var(--sizes-10)",
                },
              },
            },
            {
              "className": "checkbox__label--size_md",
              "conditions": undefined,
              "entry": {
                "prop": "size",
                "recipe": "checkbox",
                "slot": "label",
                "value": "md",
              },
              "hash": "size]___[value:md]___[recipe:checkbox]___[slot:label]___[slot:label",
              "layer": undefined,
              "result": {
                ".checkbox__label--size_md": {
                  "fontSize": "var(--font-sizes-md)",
                },
              },
            },
          },
        },
        "recipes_base": Map {
          "checkbox__root" => Set {
            {
              "className": "checkbox__root",
              "details": [
                {
                  "conditions": undefined,
                  "entry": {
                    "prop": "display",
                    "recipe": "checkbox",
                    "slot": "root",
                    "value": "flex",
                  },
                  "hash": "display]___[value:flex]___[recipe:checkbox]___[slot:root",
                  "result": {
                    "display": "flex",
                  },
                },
                {
                  "conditions": undefined,
                  "entry": {
                    "prop": "alignItems",
                    "recipe": "checkbox",
                    "slot": "root",
                    "value": "center",
                  },
                  "hash": "alignItems]___[value:center]___[recipe:checkbox]___[slot:root",
                  "result": {
                    "alignItems": "center",
                  },
                },
                {
                  "conditions": undefined,
                  "entry": {
                    "prop": "gap",
                    "recipe": "checkbox",
                    "slot": "root",
                    "value": 2,
                  },
                  "hash": "gap]___[value:2]___[recipe:checkbox]___[slot:root",
                  "result": {
                    "gap": "var(--spacing-2)",
                  },
                },
              ],
              "hashSet": Set {
                "display]___[value:flex]___[recipe:checkbox]___[slot:root",
                "alignItems]___[value:center]___[recipe:checkbox]___[slot:root",
                "gap]___[value:2]___[recipe:checkbox]___[slot:root",
              },
              "recipe": "checkbox",
              "result": {
                ".checkbox__root": {
                  "alignItems": "center",
                  "display": "flex",
                  "gap": "var(--spacing-2)",
                },
              },
              "slot": "root",
            },
          },
          "checkbox__control" => Set {
            {
              "className": "checkbox__control",
              "details": [
                {
                  "conditions": undefined,
                  "entry": {
                    "prop": "borderWidth",
                    "recipe": "checkbox",
                    "slot": "control",
                    "value": "1px",
                  },
                  "hash": "borderWidth]___[value:1px]___[recipe:checkbox]___[slot:control",
                  "result": {
                    "borderWidth": "1px",
                  },
                },
                {
                  "conditions": undefined,
                  "entry": {
                    "prop": "borderRadius",
                    "recipe": "checkbox",
                    "slot": "control",
                    "value": "sm",
                  },
                  "hash": "borderRadius]___[value:sm]___[recipe:checkbox]___[slot:control",
                  "result": {
                    "borderRadius": "var(--radii-sm)",
                  },
                },
              ],
              "hashSet": Set {
                "borderWidth]___[value:1px]___[recipe:checkbox]___[slot:control",
                "borderRadius]___[value:sm]___[recipe:checkbox]___[slot:control",
              },
              "recipe": "checkbox",
              "result": {
                ".checkbox__control": {
                  "borderRadius": "var(--radii-sm)",
                  "borderWidth": "1px",
                },
              },
              "slot": "control",
            },
          },
          "checkbox__label" => Set {
            {
              "className": "checkbox__label",
              "details": [
                {
                  "conditions": undefined,
                  "entry": {
                    "prop": "marginInlineStart",
                    "recipe": "checkbox",
                    "slot": "label",
                    "value": 2,
                  },
                  "hash": "marginInlineStart]___[value:2]___[recipe:checkbox]___[slot:label",
                  "result": {
                    "marginInlineStart": "var(--spacing-2)",
                  },
                },
              ],
              "hashSet": Set {
                "marginInlineStart]___[value:2]___[recipe:checkbox]___[slot:label",
              },
              "recipe": "checkbox",
              "result": {
                ".checkbox__label": {
                  "marginInlineStart": "var(--spacing-2)",
                },
              },
              "slot": "label",
            },
          },
        },
      }
    `)
  })

  test('css - boolean utility', () => {
    const result = css({ truncate: false })
    expect(result).toMatchInlineSnapshot(`
      Set {
        {
          "className": "truncate_false",
          "conditions": undefined,
          "entry": {
            "prop": "truncate",
            "value": false,
          },
          "hash": "truncate]___[value:false",
          "layer": undefined,
          "result": {
            ".truncate_false": {},
          },
        },
      }
    `)

    const result2 = css({ truncate: true })
    expect(result2).toMatchInlineSnapshot(`
      Set {
        {
          "className": "truncate_true",
          "conditions": undefined,
          "entry": {
            "prop": "truncate",
            "value": true,
          },
          "hash": "truncate]___[value:true",
          "layer": undefined,
          "result": {
            ".truncate_true": {
              "overflow": "hidden",
              "textOverflow": "ellipsis",
              "whiteSpace": "nowrap",
            },
          },
        },
      }
    `)
  })

  test('cva - boolean variant', () => {
    const result = cva({
      base: {
        color: '#fff',
      },
      variants: {
        checked: {
          true: {
            display: 'block',
          },
          false: {
            display: 'none',
          },
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      Set {
        {
          "className": "text_\\\\#fff",
          "conditions": undefined,
          "entry": {
            "prop": "color",
            "value": "#fff",
          },
          "hash": "color]___[value:#fff",
          "layer": undefined,
          "result": {
            ".text_\\\\#fff": {
              "color": "#fff",
            },
          },
        },
        {
          "className": "d_block",
          "conditions": undefined,
          "entry": {
            "prop": "display",
            "value": "block",
          },
          "hash": "display]___[value:block",
          "layer": undefined,
          "result": {
            ".d_block": {
              "display": "block",
            },
          },
        },
        {
          "className": "d_none",
          "conditions": undefined,
          "entry": {
            "prop": "display",
            "value": "none",
          },
          "hash": "display]___[value:none",
          "layer": undefined,
          "result": {
            ".d_none": {
              "display": "none",
            },
          },
        },
      }
    `)
  })
})
