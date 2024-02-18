import { expect, test } from 'vitest'
import { getPropertyPriority } from '../src'

test('property priotity', () => {
  expect(getPropertyPriority('all')).toMatchInlineSnapshot(`0`)
  expect(getPropertyPriority('paddingTop')).toMatchInlineSnapshot(`2`)
  expect(getPropertyPriority('background')).toMatchInlineSnapshot(`1`)
  expect(getPropertyPriority('backgroundColor')).toMatchInlineSnapshot(`2`)
  expect(getPropertyPriority('padding')).toMatchInlineSnapshot(`1`)

  expect(
    ['backgroundColor', 'padding', 'background', 'all', 'paddingTop'].sort(
      (a, b) => getPropertyPriority(a) - getPropertyPriority(b),
    ),
  ).toMatchInlineSnapshot(`
    [
      "all",
      "padding",
      "background",
      "backgroundColor",
      "paddingTop",
    ]
  `)
})
