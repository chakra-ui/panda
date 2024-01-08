import { describe, test, expect } from 'vitest'
import { getArbitraryValue } from '../src'

describe('arbitrary className', () => {
  test('simple', () => {
    expect(getArbitraryValue('[#3B00B9]')).toMatchInlineSnapshot('"#3B00B9"')
    expect(getArbitraryValue('[123px]')).toMatchInlineSnapshot('"123px"')
  })

  test('named grid lines', () => {
    expect(
      getArbitraryValue(`
    [full-start]
      minmax(16px, 1fr)
        [breakout-start]
          minmax(0, 16px)
            [content-start]
              minmax(min-content, 1024px)
            [content-end]
          minmax(0, 16px)
        [breakout-end]
      minmax(16px, 1fr)
    [full-end]
  `),
    ).toMatchInlineSnapshot(`
      "
          [full-start]
            minmax(16px, 1fr)
              [breakout-start]
                minmax(0, 16px)
                  [content-start]
                    minmax(min-content, 1024px)
                  [content-end]
                minmax(0, 16px)
              [breakout-end]
            minmax(16px, 1fr)
          [full-end]
        "
    `)
  })
})
