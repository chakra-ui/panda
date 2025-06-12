import { expect, test } from 'vitest'
import { getPropertyPriority } from '../src'

const sort = (properties: string[]) => properties.sort((a, b) => getPropertyPriority(a) - getPropertyPriority(b))

describe('property priority', () => {
  test('mixed properties w/ all', () => {
    expect(sort(['backgroundColor', 'padding', 'background', 'all', 'paddingTop'])).toMatchInlineSnapshot(`
    [
      "all",
      "padding",
      "background",
      "backgroundColor",
      "paddingTop",
    ]
  `)
  })

  test('padding', () => {
    expect(
      sort([
        'paddingTop',
        'padding',
        'paddingBlock',
        'paddingBlockStart',
        'paddingInlineStart',
        'paddingLeft',
        'paddingRight',
        'paddingBottom',
        'paddingInline',
        'paddingBlockEnd',
        'paddingInlineEnd',
      ]),
    ).toMatchInlineSnapshot(`
    [
      "padding",
      "paddingBlock",
      "paddingInline",
      "paddingBlockStart",
      "paddingInlineStart",
      "paddingBlockEnd",
      "paddingInlineEnd",
      "paddingTop",
      "paddingLeft",
      "paddingRight",
      "paddingBottom",
    ]
  `)
  })

  test('margin', () => {
    expect(
      sort([
        'marginTop',
        'margin',
        'marginBlock',
        'marginBlockStart',
        'marginInlineStart',
        'marginLeft',
        'marginRight',
        'marginBottom',
        'marginInline',
        'marginBlockEnd',
        'marginInlineEnd',
      ]),
    ).toMatchInlineSnapshot(`
      [
        "margin",
        "marginBlock",
        "marginInline",
        "marginBlockStart",
        "marginInlineStart",
        "marginBlockEnd",
        "marginInlineEnd",
        "marginTop",
        "marginLeft",
        "marginRight",
        "marginBottom",
      ]
    `)
  })
})
