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

  it('cva resolves boolean variant keys (JS coerces true → "true")', () => {
    const button = cva({
      base: 'd_inline-flex',
      variants: {
        disabled: { true: 'opacity_0.5' },
        block: { true: 'w_100%' },
      },
    })

    expect(button({ disabled: true })).toBe('d_inline-flex opacity_0.5')
    expect(button({ disabled: false, block: true })).toBe('d_inline-flex w_100%')
    expect(button({ disabled: true, block: true })).toBe('d_inline-flex opacity_0.5 w_100%')
  })

  it('cva applies a boolean defaultVariant until the prop overrides it', () => {
    const button = cva({
      base: 'd_flex',
      variants: {
        muted: { true: 'opacity_0.5' },
        block: { true: 'w_100%' },
      },
      defaultVariants: { muted: true },
    })

    expect(button()).toBe('d_flex opacity_0.5')
    expect(button({ block: true })).toBe('d_flex opacity_0.5 w_100%')
    expect(button({ muted: false })).toBe('d_flex')
    // an absent prop is not a choice — the default stands
    expect(button({ muted: undefined })).toBe('d_flex opacity_0.5')
  })

  it('cva returns the same string for a repeated prop tuple', () => {
    const button = cva({
      base: 'd_flex',
      variants: {
        size: { sm: 'fs_sm', md: 'fs_md' },
      },
    })

    const first = button({ size: 'sm' })
    expect(button({ size: 'sm' })).toBe(first)
    expect(button({ size: 'md' })).toBe('d_flex fs_md')
    // raw stays uncached and agrees with the memoized call
    expect(button.raw({ size: 'sm' })).toBe(first)
  })

  it('sva returns the same slot map for a repeated prop tuple', () => {
    const card = sva({
      slots: ['root', 'title'],
      base: { root: 'd_flex', title: 'fw_bold' },
      variants: { muted: { true: 'opacity_0.5' } },
    })

    expect(card({ muted: true })).toBe(card({ muted: true }))
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

  it('sva resolves a boolean variant across every slot', () => {
    const card = sva({
      slots: ['root', 'title'],
      base: { root: 'd_flex', title: 'fw_bold' },
      variants: {
        muted: { true: 'opacity_0.5' },
      },
    })

    expect(card({ muted: true })).toEqual({
      root: 'd_flex opacity_0.5',
      title: 'fw_bold opacity_0.5',
    })
    expect(card({ muted: false })).toEqual({
      root: 'd_flex',
      title: 'fw_bold',
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

describe('cva.merge — styled(Parent, styles) chains', () => {
  it('exposes merge so composeCvaFn can fuse a chain', () => {
    expect(typeof cva({ base: 'a' }).merge).toBe('function')
  })

  it('concatenates the two bases', () => {
    const merged = cva({ base: 'color_red' }).merge(cva({ base: 'padding-left_2px' }))

    expect(merged.raw({})).toBe('color_red padding-left_2px')
  })

  it('lets the override win when both bases set the same property', () => {
    const merged = cva({ base: 'border-left_1px' }).merge(cva({ base: 'border-left_2px' }))

    expect(merged.raw({})).toBe('border-left_2px')
  })

  it('merges options of a shared variant key, override last', () => {
    const merged = cva({ variants: { size: { sm: 'padding_4px' } } }).merge(
      cva({ variants: { size: { sm: 'padding_8px', lg: 'padding_12px' } } }),
    )

    expect(merged.raw({ size: 'sm' })).toBe('padding_8px')
    expect(merged.raw({ size: 'lg' })).toBe('padding_12px')
  })

  it('keeps variant keys that only one side declares', () => {
    const merged = cva({ variants: { size: { sm: 'padding_4px' } } }).merge(
      cva({ variants: { tone: { a: 'color_blue' } } }),
    )

    expect(merged.variantKeys.sort()).toEqual(['size', 'tone'])
    expect(merged.raw({ size: 'sm', tone: 'a' })).toBe('padding_4px color_blue')
  })

  it('lets the override default variants win', () => {
    const merged = cva({
      variants: { size: { sm: 'padding_4px', lg: 'padding_8px' } },
      defaultVariants: { size: 'sm' },
    }).merge(cva({ defaultVariants: { size: 'lg' } }))

    expect(merged.raw({})).toBe('padding_8px')
  })

  it('carries compound variants from both sides', () => {
    const merged = cva({
      variants: { size: { sm: 'padding_4px' } },
      compoundVariants: [{ size: 'sm', css: 'margin_1px' }],
    }).merge(
      cva({
        variants: { tone: { a: 'color_blue' } },
        compoundVariants: [{ tone: 'a', css: 'outline_2px' }],
      }),
    )

    // Variant keys follow the generated `uniq(other.variantKeys, variantKeys)`
    // order — the override's keys first — so `tone` leads `size` here.
    expect(merged.raw({ size: 'sm', tone: 'a' })).toBe('color_blue padding_4px margin_1px outline_2px')
  })

  it('keeps a conditional class distinct from the same property unconditioned', () => {
    const merged = cva({ base: 'color_red hover:color_blue' }).merge(cva({ base: 'color_green' }))

    expect(merged.raw({})).toBe('color_green hover:color_blue')
  })

  it('lets the override win on a matching condition', () => {
    const merged = cva({ base: 'hover:color_blue' }).merge(cva({ base: 'hover:color_green' }))

    expect(merged.raw({})).toBe('hover:color_green')
  })

  it('is chainable, so a three-level chain collapses to one recipe', () => {
    const l0 = cva({ base: 'color_red padding-left_1px' })
    const l1 = l0.merge(cva({ base: 'padding-left_2px' }))
    const l2 = l1.merge(cva({ base: 'padding-left_3px' }))

    expect(l2.raw({})).toBe('color_red padding-left_3px')
  })
})
