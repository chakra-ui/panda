import { describe, expect, expectTypeOf, test } from 'vitest'
import { button, type ButtonVariantProps } from '../styled-system/recipes/button'
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

  test('split variant props keeps a union of component props', () => {
    type Props = { visual: 'solid' } & (
      | { role: 'guest'; expiration: number }
      | { role: 'admin'; permissions: string[] }
    )
    const split = (props: Props) => button.splitVariantProps(props)[1]

    expectTypeOf(split).returns.toEqualTypeOf<
      { role: 'guest'; expiration: number } | { role: 'admin'; permissions: string[] }
    >()
    expect(split({ visual: 'solid', role: 'guest', expiration: 1 })).toEqual({ role: 'guest', expiration: 1 })
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

  test('variantMap values are typed without undefined', () => {
    const visuals: readonly ('outline' | 'solid')[] = button.variantMap.visual

    expectTypeOf(button.variantMap.visual).toEqualTypeOf<Array<'outline' | 'solid'>>()
    expect(visuals).toEqual(['solid', 'outline'])
  })

  test('raw returns the variant props it was given', () => {
    expectTypeOf(button.raw({ visual: 'solid' })).toEqualTypeOf<ButtonVariantProps>()
    expect(button.raw({ visual: 'solid' })).toEqual({ visual: 'solid' })
  })

  test('split variant props checks variant values', () => {
    // @ts-expect-error `typo` isn't a visual variant
    button.splitVariantProps({ visual: 'typo' })

    expect(button.splitVariantProps({ id: 'x' })).toEqual([{}, { id: 'x' }])
  })
})
