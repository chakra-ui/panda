import { describe, expect, test } from 'vitest'
import { css, cva, type RecipeVariantProps } from '../styled-system/css'
import { styled, type HTMLStyledProps } from '../styled-system/jsx'
import { stack } from '../styled-system/patterns'
import { button } from '../styled-system/recipes/button'
import { buttonWithCompoundVariants } from '../styled-system/recipes/button-with-compound-variants'
import { slotButton } from '../styled-system/recipes/slot-button'

// tsconfig.json enables `exactOptionalPropertyTypes`, so the typecheck run fails if these stop accepting `undefined`.
const visual = undefined as 'outline' | 'solid' | undefined
const size = undefined as 'sm' | 'lg' | undefined
const color = undefined as 'red.500' | undefined

describe('variant props accept undefined under exactOptionalPropertyTypes', () => {
  test('config recipe', () => {
    expect(button({ visual })).toMatchInlineSnapshot(`"button"`)
  })

  test('config recipe with compound variants', () => {
    expect(buttonWithCompoundVariants({ size })).toBeTypeOf('string')
  })

  test('config slot recipe', () => {
    expect(slotButton({ visual })).toBeTypeOf('object')
  })

  test('cva forwarding its own RecipeVariantProps', () => {
    const editor = cva({ variants: { size: { sm: {}, lg: {} } } })
    const render = (props: RecipeVariantProps<typeof editor>) => editor({ size: props?.size })
    expect(render({ size })).toBeTypeOf('string')
  })

  test('cva default and compound variants set to undefined', () => {
    const editor = cva({
      variants: { size: { sm: {}, lg: {} } },
      defaultVariants: { size: undefined },
      compoundVariants: [{ size: undefined, css: {} }],
    })
    expect(editor()).toBeTypeOf('string')
  })

  test('styled component variant prop', () => {
    const _Button = styled('button', button)
    const props: Parameters<typeof _Button>[0] = { visual }
    expect(props).toEqual({ visual: undefined })
  })
})

describe('style props accept undefined under exactOptionalPropertyTypes', () => {
  test('css property', () => {
    expect(css({ color })).toMatchInlineSnapshot(`""`)
  })

  test('condition object value', () => {
    expect(css({ color: { base: color, _hover: color } })).toMatchInlineSnapshot(`""`)
  })

  test('css variable', () => {
    expect(css({ '--accent': color })).toMatchInlineSnapshot(`""`)
  })

  test('pattern prop', () => {
    expect(stack({ gap: color })).toBeTypeOf('string')
  })

  test('jsx style prop', () => {
    const props: HTMLStyledProps<'div'> = { color }
    expect(props).toEqual({ color: undefined })
  })
})
