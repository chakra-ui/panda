import { describe, expect, it } from 'vitest'
import { cva, css, cx, sva } from '../src/runtime/internal'
import { isInternalCssImport } from '../src/runtime/internal/ids'

describe('@pandacss-internal/css runtime', () => {
  it('cx merges conflicting panda utilities', () => {
    expect(cx('px_4', 'px_2')).toBe('px_2')
  })

  it('css joins pre-encoded class strings via cx', () => {
    expect(css('color_red', 'bg_blue')).toBe('color_red bg_blue')
  })

  it('cva resolves string branches with cx', () => {
    const button = cva({
      base: 'c_red bg_blue',
      variants: {
        size: {
          sm: 'fs_sm',
          md: 'fs_md',
        },
      },
      defaultVariants: { size: 'md' },
    })

    expect(button()).toBe('c_red bg_blue fs_md')
    expect(button({ size: 'sm' })).toBe('c_red bg_blue fs_sm')
    expect(button.__cva__).toBe(true)
  })

  it('sva resolves per-slot string branches', () => {
    const tabs = sva({
      slots: ['root', 'trigger'],
      base: {
        root: 'd_flex',
        trigger: 'cursor_pointer',
      },
      variants: {
        size: {
          sm: 'fs_sm',
        },
      },
    })

    expect(tabs({ size: 'sm' })).toEqual({
      root: 'd_flex fs_sm',
      trigger: 'cursor_pointer fs_sm',
    })
  })

  it('sva supports generated slot class maps and shared variant strings', () => {
    const dialog = sva({
      slots: ['root', 'content'],
      className: {
        root: 'chakra-dialog',
        content: 'chakra-dialog__content',
      },
      base: {
        root: 'bg_bg',
        content: 'shadow_lg',
      },
      variants: {
        placement: {
          top: 'items_start mx_auto',
        },
      },
      defaultVariants: {
        placement: 'top',
      },
    })

    expect(dialog()).toMatchInlineSnapshot(`
      {
        "content": "shadow_lg chakra-dialog__content items_start mx_auto",
        "root": "bg_bg chakra-dialog items_start mx_auto",
      }
    `)
  })

  it('recognizes the virtual internal css import id', () => {
    expect(isInternalCssImport('@pandacss-internal/css')).toBe(true)
    expect(isInternalCssImport('@panda/css')).toBe(false)
  })
})

describe('virtual internal css ids', () => {
  it('uses stable internal import and resolved ids', async () => {
    const { INTERNAL_CSS_IMPORT, INTERNAL_CSS_RESOLVED_ID } = await import('../src/runtime/internal/ids')

    expect(INTERNAL_CSS_IMPORT).toBe('@pandacss-internal/css')
    expect(INTERNAL_CSS_RESOLVED_ID.startsWith('\0pandacss:internal:css')).toBe(true)
  })
})
