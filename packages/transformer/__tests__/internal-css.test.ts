import { describe, expect, it } from 'vitest'
import { attachRecipe, css, cx } from '../src/runtime/internal'
import { isInternalCssImport } from '../src/runtime/internal/ids'

describe('@pandacss-internal/css runtime', () => {
  it('cx merges conflicting panda utilities', () => {
    expect(cx('px_4', 'px_2')).toBe('px_2')
  })

  it('css joins pre-encoded class strings via cx', () => {
    expect(css('color_red', 'bg_blue')).toBe('color_red bg_blue')
  })

  it('recognizes the virtual internal css import id', () => {
    expect(isInternalCssImport('@pandacss-internal/css')).toBe(true)
    expect(isInternalCssImport('@panda/css')).toBe(false)
  })
})

describe('attachRecipe — specialized recipe surface', () => {
  const button = attachRecipe(
    (props: Record<string, unknown> = {}) => (props.size === 'lg' ? 'fs_16px' : 'fs_12px'),
    {
      variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
      defaultVariants: { size: 'sm' },
    },
    ['size'],
    { size: ['sm', 'lg'] },
  )

  it('keeps the specialized function callable', () => {
    expect(button({ size: 'lg' })).toBe('fs_16px')
  })

  it('exposes cva metadata on an exported recipe', () => {
    expect(button.__cva__).toBe(true)
    expect(button.variantKeys).toEqual(['size'])
    expect(button.variantMap).toEqual({ size: ['sm', 'lg'] })
    expect(button.config.defaultVariants).toEqual({ size: 'sm' })
    expect('classNameMap' in button).toBe(false)
  })

  it('fills defaults for absent and undefined variant props', () => {
    expect(button.getVariantProps()).toEqual({ size: 'sm' })
    expect(button.getVariantProps({ size: undefined, id: 'save' })).toEqual({ size: 'sm', id: 'save' })
  })

  it('splits variant props first, like the generated styled-system recipe', () => {
    expect(button.splitVariantProps({ size: 'lg', id: 'save' })).toEqual([{ size: 'lg' }, { id: 'save' }])
  })

  it('marks a recipe with a class name map as a slot recipe', () => {
    const tabs = attachRecipe(
      () => ({ root: 'tabs__root', trigger: 'tabs__trigger' }),
      { slots: ['root', 'trigger'], className: 'tabs' },
      [],
      {},
      { root: 'tabs__root', trigger: 'tabs__trigger' },
    )

    expect(tabs.__cva__).toBe(false)
    expect(tabs.classNameMap).toEqual({ root: 'tabs__root', trigger: 'tabs__trigger' })
    expect(tabs.getVariantProps({ id: 'tabs' })).toEqual({ id: 'tabs' })
  })
})
