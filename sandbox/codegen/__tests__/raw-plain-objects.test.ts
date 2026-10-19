import { describe, expect, test } from 'vitest'
import { css } from '../styled-system/css/css'
import { cva } from '../styled-system/css/cva'
import { sva } from '../styled-system/css/sva'
import { splitCssProps } from '../styled-system/jsx/is-valid-prop'
import { button } from '../styled-system/recipes/button'

describe('raw() and split helpers return plain objects', () => {
  test('css.raw result matches a literal with toStrictEqual', () => {
    const styles = css.raw({ color: 'red', _hover: { color: 'blue' } })

    expect(styles).toStrictEqual({ color: 'red', _hover: { color: 'blue' } })
  })

  test('css.raw merges several objects into a plain object', () => {
    const styles = css.raw({ color: 'red' }, { background: 'blue', _hover: { color: 'green' } })

    expect(styles).toStrictEqual({ color: 'red', background: 'blue', _hover: { color: 'green' } })
  })

  test('css.raw result supports hasOwnProperty and string coercion', () => {
    const styles = css.raw({ color: 'red' })

    expect(styles.hasOwnProperty('color')).toBe(true)
    expect(String(styles)).toBe('[object Object]')
  })

  test('cva raw result matches a literal with toStrictEqual', () => {
    const badge = cva({
      base: { color: 'red', _hover: { color: 'blue' } },
      variants: { size: { sm: { padding: '2' } } },
    })

    expect(badge.raw({ size: 'sm' })).toStrictEqual({ color: 'red', _hover: { color: 'blue' }, padding: '2' })
  })

  test('sva raw slots match a literal with toStrictEqual', () => {
    const card = sva({
      slots: ['root', 'label'],
      base: { root: { color: 'red', _hover: { color: 'blue' } }, label: { fontWeight: 'bold' } },
    })

    expect(card.raw()).toStrictEqual({
      root: { color: 'red', _hover: { color: 'blue' } },
      label: { fontWeight: 'bold' },
    })
  })

  test('config recipe splitVariantProps returns plain objects', () => {
    const [variantProps, rest] = button.splitVariantProps({ visual: 'solid', id: 'x' })

    expect(variantProps).toStrictEqual({ visual: 'solid' })
    expect(rest).toStrictEqual({ id: 'x' })
  })

  test('splitCssProps returns plain objects', () => {
    const [cssProps, rest] = splitCssProps({ color: 'red', id: 'x' })

    expect(cssProps).toStrictEqual({ color: 'red' })
    expect(rest).toStrictEqual({ id: 'x' })
  })
})
