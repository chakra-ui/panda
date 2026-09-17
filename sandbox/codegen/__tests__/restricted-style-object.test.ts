import { assertType, describe, test } from 'vitest'
import type { SystemStyleObjectWith, SystemStyleObjectWithout } from '../styled-system/types'

// a design-system component that lets consumers override layout, not color
type ButtonCss = SystemStyleObjectWith<'margin' | 'marginTop' | 'width' | 'position' | 'inset'>

describe('SystemStyleObjectWith', () => {
  test('accepts the listed properties, responsive values and nesting', () => {
    assertType<ButtonCss>({ marginTop: '4' })
    assertType<ButtonCss>({ marginTop: ['4', '8'] })
    assertType<ButtonCss>({ marginTop: { base: '4', md: '8' } })
    assertType<ButtonCss>({ _hover: { marginTop: '8' } })
    assertType<ButtonCss>({ '& > *': { width: 'full' } })
    assertType<ButtonCss>({ '@media (min-width: 40em)': { width: 'full' } })
  })

  test('rejects everything else, inside conditions too', () => {
    // @ts-expect-error color is not listed
    assertType<ButtonCss>({ color: 'red.500' })
    // @ts-expect-error css vars are not on the surface
    assertType<ButtonCss>({ '--x': '1' })
    // @ts-expect-error the restriction holds inside a condition
    assertType<ButtonCss>({ _hover: { color: 'red.500' } })
  })
})

describe('SystemStyleObjectWithout', () => {
  type CardCss = SystemStyleObjectWithout<'color' | 'background'>

  test('keeps everything but the listed properties', () => {
    assertType<CardCss>({ padding: '4', _dark: { padding: '6' } })
  })

  test('drops the listed properties', () => {
    // @ts-expect-error color was removed
    assertType<CardCss>({ color: 'red.500' })
  })
})
