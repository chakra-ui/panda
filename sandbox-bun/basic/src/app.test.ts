import { expect, test } from 'bun:test'
import { card, page, tag } from './app'

const classes = (value: string) => value.split(' ').sort()

test('css() resolves to Panda class names', () => {
  expect(classes(page)).toEqual(classes('d_grid min-h_100vh place-items_center bg_brand.50 text_ink.900 p_24px'))
  expect(classes(card)).toEqual(classes('d_grid gap_16px p_32px rounded_24px bg_white text_brand.700'))
})

test('recipes resolve to their variant classes', () => {
  expect(tag).toBe('badge badge--tone_brand')
})
