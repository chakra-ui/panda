import { describe, expect, test } from 'vitest'
import { sortAtRules } from '../src/plugins/sort-at-rules'

// TODO refacto via sortStyleRules
describe('sort-at-rules', () => {
  test(`should sort mobile first`, () => {
    const receivedOrder = [
      'screen and (max-width: 640px)',
      'screen and (min-width: 980px)',
      'screen and (max-width: 980px)',
      'tv',
      'screen and (max-width: 768px)',
      'screen and (min-width: 640px)',
      'print',
      'screen and (min-width: 1280px)',
      'screen',
      'screen and (min-width: 768px)',
      'screen and (max-width: 1280px)',
    ]

    const expectedOrder = [
      'screen and (min-width: 640px)',
      'screen and (min-width: 768px)',
      'screen and (min-width: 980px)',
      'screen and (min-width: 1280px)',
      'screen and (max-width: 1280px)',
      'screen and (max-width: 980px)',
      'screen and (max-width: 768px)',
      'screen and (max-width: 640px)',
      'screen',
      'tv',
      'print', // always last
    ]

    const expected = expectedOrder.join('\n')
    const received = receivedOrder.sort(sortAtRules).join('\n')
    expect(received).toBe(expected)
  })
})
