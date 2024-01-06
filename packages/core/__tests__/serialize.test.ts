import { createContext } from '@pandacss/fixture'
import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { transformStyles } from '../src/serialize'

const css = (style: Dict) => {
  return transformStyles(createContext(), style, JSON.stringify(style))
}

describe('serialize', () => {
  test('should serialize', () => {
    const result = css({
      html: {
        color: 'red',
        border: '2px solid {colors.red.200}',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "border": "2px solid var(--colors-red-200)",
        "color": "red",
      }
    `)
  })

  test('skip non-existent', () => {
    const result = css({
      html: {
        border: '2px solid {colors.red.xxx}',
        bg: '{colors.xxx}',
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "background": "colors.xxx",
        "border": "2px solid colors.red.xxx",
      }
    `)
  })

  test('expand multiple references', () => {
    const result = css({
      html: {
        padding: '{spacing.3} {spacing.5}',
        _hover: {
          padding: '{spacing.7}',
        },
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "&:is(:hover, [data-hover])": {
          "padding": "var(--spacing-7)",
        },
        "padding": "var(--spacing-3) var(--spacing-5)",
      }
    `)
  })
})
