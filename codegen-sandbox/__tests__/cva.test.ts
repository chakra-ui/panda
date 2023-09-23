import { describe, expect, test } from 'vitest'
import { cva } from '../styled-system/css/cva'

describe('cva', () => {
  const button = cva({
    base: {
      borderRadius: 'md',
      fontWeight: 'semibold',
      h: '10',
      px: '4',
    },
    variants: {
      visual: {
        solid: {
          bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
          color: { base: 'white', _dark: 'gray.800' },
        },
        outline: {
          border: '1px solid',
          color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
          borderColor: 'currentColor',
        },
      },
    },
  })

  test('base styles', () => {
    const result = button()

    expect(result).toMatchInlineSnapshot('"rounded_md font_semibold h_10 px_4"')
  })

  test('solid variant styles', () => {
    const result = button({ visual: 'solid' })

    expect(result).toMatchInlineSnapshot(
      '"rounded_md font_semibold h_10 px_4 bg_colorPalette.500 dark:bg_colorPalette.300 text_white dark:text_gray.800"',
    )
  })

  test('outline variant styles', () => {
    const result = button({ visual: 'outline' })

    expect(result).toMatchInlineSnapshot(
      '"rounded_md font_semibold h_10 px_4 border_1px_solid text_colorPalette.600 dark:text_colorPalette.200 border_currentColor"',
    )
  })

  test('split variant props', () => {
    const result = button.splitVariantProps({ visual: 'solid', bg: 'red.500' })

    expect(result).toMatchInlineSnapshot([{ visual: 'solid' }, { bg: 'red.500' }])
  })
})
