import { describe, expect, it } from 'vitest'
import { cx } from '../src/runtime/internal/cx'

describe('cx', () => {
  it('merges conflicting panda utilities with last-wins semantics', () => {
    expect(cx('px_4', 'px_2')).toMatchInlineSnapshot(`"px_2"`)
    expect(cx('hover:px_4', 'hover:px_2')).toMatchInlineSnapshot(`"hover:px_2"`)
    expect(cx('mt_4 c_red', 'c_blue.500')).toMatchInlineSnapshot(`"mt_4 c_blue.500"`)
  })

  it('joins non-conflicting parts and skips falsy values', () => {
    expect(cx('a', false, null, undefined, 'b', ['c', '', 'd'])).toMatchInlineSnapshot(`"a b c d"`)
    expect(cx(false, null, undefined, [])).toMatchInlineSnapshot(`""`)
  })

  it('keeps duplicate non-panda classes', () => {
    expect(cx('custom', 'custom')).toMatchInlineSnapshot(`"custom custom"`)
    expect(cx('btn', 'px_4', 'btn', 'px_2')).toMatchInlineSnapshot(`"btn px_2 btn"`)
  })

  it('flattens nested arrays before merging', () => {
    expect(cx(['d_flex px_4', ['h_8', false]], 'px_2')).toMatchInlineSnapshot(`"d_flex px_2 h_8"`)
  })

  it('returns a lone class string untouched', () => {
    // Producers emit conflict-free strings, so there is nothing to merge and
    // the transform's `cx(staticClasses, props.className)` stays cheap when no
    // `className` is passed through.
    expect(cx('d_flex px_4', undefined)).toMatchInlineSnapshot(`"d_flex px_4"`)
    expect(cx([false, 'd_flex px_4'])).toMatchInlineSnapshot(`"d_flex px_4"`)
  })
})
