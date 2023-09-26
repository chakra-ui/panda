import { describe, expect, test } from 'vitest'
import { button } from '../styled-system/recipes/button.mjs'
import { buttonWithCompoundVariants } from '../styled-system/recipes/button-with-compound-variants.mjs'

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

  test('using conditions', () => {
    const result = button({ visual: { base: 'solid', _hover: 'outline' } })
    expect(result).toMatchInlineSnapshot('"button button--visual_solid _hover:button--visual_outline"')
  })

  test('compoundVariants', () => {
    const result = buttonWithCompoundVariants({ visual: 'solid' })

    expect(result).toMatchInlineSnapshot('"button button--visual_solid text_blue"')

    const result2 = buttonWithCompoundVariants({ visual: 'outline', size: 'md' })
    expect(result2).toMatchInlineSnapshot('"button button--visual_outline button--size_md text_green"')
  })

  test('throws an error when using conditions with compound variants', () => {
    expect(() => buttonWithCompoundVariants({ visual: { base: 'solid', _hover: 'outline' } })).toThrow(
      '[recipe:button:visual] Conditions are not supported when using compound variants.',
    )
  })
})
