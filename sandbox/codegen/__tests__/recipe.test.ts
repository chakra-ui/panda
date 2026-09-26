import { describe, expect, test } from 'vitest'
import { button } from '../styled-system/recipes/button'
import { buttonWithCompoundVariants } from '../styled-system/recipes/button-with-compound-variants'

// Both recipes are defined in ../preset.ts.

describe('recipe', () => {
  test('base styles', () => {
    const result = button()

    expect(result).toMatchInlineSnapshot('"button"')
  })

  test('split variant props', () => {
    const result = button.splitVariantProps({ visual: 'solid', bg: 'red.500' })
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "visual": "solid",
        },
        {
          "bg": "red.500",
        },
      ]
    `)
  })

  test('solid variant styles', () => {
    const result = button({ visual: 'solid' })

    expect(result).toMatchInlineSnapshot('"button button--visual_solid"')
  })

  test('outline variant styles', () => {
    const result = button({ visual: 'outline' })

    expect(result).toMatchInlineSnapshot('"button button--visual_outline"')
  })

  test('conditional variant value', () => {
    const result = button({ visual: { base: 'solid', _hover: 'outline' } })
    expect(result).toMatchInlineSnapshot('"button button--visual_solid hover:button--visual_outline"')
  })

  test('compound variant keyed on visual alone', () => {
    const result = buttonWithCompoundVariants({ visual: 'solid' })

    expect(result).toMatchInlineSnapshot(`"button button--visual_solid button--compound__visual_solid"`)
  })

  test('compound variant keyed on visual and a single size', () => {
    const result = buttonWithCompoundVariants({ visual: 'outline', size: 'md' })

    expect(result).toMatchInlineSnapshot(
      `"button button--visual_outline button--size_md button--compound__size_md__visual_outline"`,
    )
  })

  test('compound variant keyed on a size list matches its first size', () => {
    const result = buttonWithCompoundVariants({ visual: 'outline', size: 'sm' })

    expect(result).toMatchInlineSnapshot(
      `"button button--visual_outline button--size_sm button--compound__size_sm|lg__visual_outline"`,
    )
  })

  test('compound variant keyed on a size list matches its last size', () => {
    const result = buttonWithCompoundVariants({ visual: 'outline', size: 'lg' })

    expect(result).toMatchInlineSnapshot(
      `"button button--visual_outline button--size_lg button--compound__size_sm|lg__visual_outline"`,
    )
  })

  test('throws an error when using conditions with compound variants', () => {
    // @ts-expect-error conditional variant values are not typed on recipes with compound variants
    expect(() => buttonWithCompoundVariants({ visual: { base: 'solid', _hover: 'outline' } })).toThrow(
      '[recipe:button:visual] Conditions are not supported when using compound variants.',
    )
  })

  test('split variant props with compound variants', () => {
    const result = buttonWithCompoundVariants.splitVariantProps({ visual: 'solid', bg: 'red.500' })

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "visual": "solid",
        },
        {
          "bg": "red.500",
        },
      ]
    `)
  })

  test('get variant props with compound variants', () => {
    const result = buttonWithCompoundVariants.getVariantProps({ visual: 'outline' })

    expect(result).toMatchInlineSnapshot(`
      {
        "button": "__ignore__",
        "visual": "outline",
      }
    `)
  })
})
