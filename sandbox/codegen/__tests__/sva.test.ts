import { describe, expect, test } from 'vitest'
import { sva } from '../styled-system/css/sva'

describe('sva', () => {
  const button = sva({
    slots: ['root', 'icon'],
    base: {
      root: { borderRadius: 'md', fontWeight: 'semibold', h: '10', px: '4' },
      icon: { fontSize: '2xl' },
    },
    variants: {
      visual: {
        solid: {
          root: {
            bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
            color: { base: 'white', _dark: 'gray.800' },
          },
          icon: {
            color: 'white',
          },
        },
        outline: {
          root: {
            border: '1px solid',
            color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
            borderColor: 'currentColor',
          },
          icon: {
            border: '1px solid',
          },
        },
        unstyled: {},
      },
    },
    defaultVariants: {
      visual: 'unstyled',
    },
  })

  test('base styles', () => {
    const result = button()

    expect(result).toMatchInlineSnapshot(`
      {
        "icon": "fs_2xl",
        "root": "bdr_md fw_semibold h_10 px_4",
      }
    `)
  })

  test('solid variant styles', () => {
    const result = button({ visual: 'solid' })

    expect(result).toMatchInlineSnapshot(
      `
      {
        "icon": "fs_2xl c_white",
        "root": "bdr_md fw_semibold h_10 px_4 bg_colorPalette.500 dark:bg_colorPalette.300 c_white dark:c_gray.800",
      }
    `,
    )
  })

  test('outline variant styles', () => {
    const result = button({ visual: 'outline' })

    expect(result).toMatchInlineSnapshot(
      `
      {
        "icon": "fs_2xl bd_1px_solid",
        "root": "bdr_md fw_semibold h_10 px_4 bd_1px_solid c_colorPalette.600 dark:c_colorPalette.200 bd-c_currentColor",
      }
    `,
    )
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

  test('get variant props', () => {
    const result = button.getVariantProps()

    expect(result).toMatchInlineSnapshot(`
      {
        "visual": "unstyled",
      }
    `)
  })
})
