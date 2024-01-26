import { describe, test, expect } from 'vitest'
import { extractParentSelectors } from '../src/selector'

describe('selectors', () => {
  test('multiple - should extract parent selector', () => {
    const selectors = extractParentSelectors('&&.dark, .dark &, &[data-theme=dark], [data-theme="dark"] &')
    expect(selectors).toMatchInlineSnapshot('":where(.dark, [data-theme=\\"dark\\"])"')
  })

  test('single - should not wrap in :where', () => {
    const selectors = extractParentSelectors('[data-theme="dark"] &')
    expect(selectors).toMatchInlineSnapshot('"[data-theme=\\"dark\\"]"')
  })
})
