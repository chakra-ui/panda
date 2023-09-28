import { describe, expect, test } from 'vitest'
import { slotButton } from '../styled-system/recipes/'

describe('sva', () => {
  test('base styles', () => {
    const result = slotButton()

    expect(result).toMatchInlineSnapshot(`
      {
        "icon": "slot-button__icon",
        "root": "slot-button__root",
      }
    `)
  })

  test('solid variant styles', () => {
    const result = slotButton({ visual: 'solid' })

    expect(result).toMatchInlineSnapshot(
      `
      {
        "icon": "slot-button__icon slot-button__icon--visual_solid",
        "root": "slot-button__root slot-button__root--visual_solid",
      }
    `,
    )
  })

  test('outline variant styles', () => {
    const result = slotButton({ visual: 'outline' })

    expect(result).toMatchInlineSnapshot(
      `
      {
        "icon": "slot-button__icon slot-button__icon--visual_outline",
        "root": "slot-button__root slot-button__root--visual_outline",
      }
    `,
    )
  })

  test('split variant props', () => {
    const result = slotButton.splitVariantProps({ visual: 'solid', bg: 'red.500' })

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
})
