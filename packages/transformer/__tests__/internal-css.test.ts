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

  it('cva agrees with raw for every boolean prop shape', () => {
    const button = cva({
      base: 'd_flex',
      variants: {
        muted: { true: 'opacity_0.5' },
        block: { true: 'w_100%' },
      },
      defaultVariants: { muted: true },
    })

    // the fast path for boolean-only recipes must not drift from `resolve`
    for (const props of [
      {},
      { muted: true },
      { muted: false },
      { muted: undefined },
      { muted: 'true' },
      { muted: 'false' },
      { muted: 1 },
      { muted: 0 },
      { block: true },
      { muted: false, block: true },
    ] as Array<Record<string, unknown>>) {
      expect(button(props)).toBe(button.raw(props))
    }
  })

  it('cva keeps the memo path when a variant is not boolean-only', () => {
    const button = cva({
      base: 'd_flex',
      variants: {
        muted: { true: 'opacity_0.5' },
        size: { sm: 'fs_sm' },
      },
    })

    expect(button({ muted: true, size: 'sm' })).toBe('d_flex opacity_0.5 fs_sm')
    expect(button({ size: 'sm' })).toBe('d_flex fs_sm')
  })

  it('cva keeps the memo path when the recipe has compound variants', () => {
    const button = cva({
      base: 'd_flex',
      variants: { muted: { true: 'opacity_0.5' } },
      compoundVariants: [{ muted: true, css: 'cursor_not-allowed' }],
    })

    expect(button({ muted: true })).toBe('d_flex opacity_0.5 cursor_not-allowed')
  })

  it('cva agrees with raw for every prop shape on a mixed recipe', () => {
    const button = cva({
      base: 'd_inline-flex',
      variants: {
        size: { sm: 'fs_sm', md: 'fs_md', lg: 'fs_lg' },
        tone: { solid: 'bg_blue', ghost: 'bg_transparent' },
        disabled: { true: 'opacity_0.5' },
      },
      defaultVariants: { size: 'md', tone: 'solid' },
    })

    // the table path must not drift from `resolve` on string variants either
    for (const props of [
      {},
      { size: 'sm' },
      { size: 'sm', tone: 'ghost' },
      { size: undefined },
      { size: null },
      { size: 'nope' },
      { disabled: true },
      { disabled: 'true' },
      { disabled: 1 },
      { size: 'lg', tone: 'ghost', disabled: true },
    ] as Array<Record<string, unknown>>) {
      expect(button(props)).toBe(button.raw(props))
    }

    expect(button()).toBe('d_inline-flex fs_md bg_blue')
    expect(button({ size: 'lg', disabled: true })).toBe('d_inline-flex fs_lg bg_blue opacity_0.5')
  })

  it('cva keeps the memo path when a default names an unknown option', () => {
    const button = cva({
      base: 'd_flex',
      variants: { size: { sm: 'fs_sm' } },
      defaultVariants: { size: 'xl' },
    })

    expect(button()).toBe('d_flex')
    expect(button({ size: 'sm' })).toBe('d_flex fs_sm')
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

describe('design system recipes', () => {
  // Every scenario asserts the fast path agrees with `raw`, so a recipe that
  // lands on the table can never drift from the one that lands on memo.
  const agreesWithRaw = (
    recipe: { (props?: Record<string, unknown>): string; raw: (props?: Record<string, unknown>) => string },
    shapes: Array<Record<string, unknown>>,
  ) => {
    for (const props of shapes) expect(recipe(props)).toBe(recipe.raw(props))
  }

  const button = cva({
    base: 'd_inline-flex items_center justify_center rounded_6px fw_500 cursor_pointer',
    variants: {
      size: { sm: 'px_3 py_1 fs_sm', md: 'px_4 py_2 fs_md', lg: 'px_6 py_3 fs_lg' },
      variant: { solid: 'bg_blue.500 c_white', outline: 'bd_1px_solid c_blue.500', ghost: 'bg_transparent c_blue.500' },
      loading: { true: 'opacity_0.6 pointer-events_none' },
    },
    defaultVariants: { size: 'md', variant: 'solid' },
  })

  it('renders a button with its default size and variant', () => {
    expect(button()).toBe(
      'd_inline-flex items_center justify_center rounded_6px fw_500 cursor_pointer px_4 py_2 fs_md bg_blue.500 c_white',
    )
  })

  it('renders a button with one variant overridden', () => {
    expect(button({ variant: 'ghost' })).toBe(
      'd_inline-flex items_center justify_center rounded_6px fw_500 cursor_pointer px_4 py_2 fs_md bg_transparent c_blue.500',
    )
  })

  it('renders a button with every variant set', () => {
    expect(button({ size: 'lg', variant: 'outline', loading: true })).toBe(
      'd_inline-flex items_center justify_center rounded_6px fw_500 cursor_pointer px_6 py_3 fs_lg bd_1px_solid c_blue.500 opacity_0.6 pointer-events_none',
    )
  })

  it('keeps the button default when a variant prop is undefined', () => {
    // <Button size={props.size} /> with nothing passed
    expect(button({ size: undefined, variant: undefined })).toBe(button())
    expect(button({ size: undefined, variant: 'ghost' })).toBe(button({ variant: 'ghost' }))
  })

  it('ignores a button variant value that no option declares', () => {
    expect(button({ size: 'xxl' })).toBe(
      'd_inline-flex items_center justify_center rounded_6px fw_500 cursor_pointer bg_blue.500 c_white',
    )
  })

  it('agrees with raw across the button prop matrix', () => {
    agreesWithRaw(button, [
      {},
      { size: 'sm' },
      { size: 'sm', variant: 'ghost' },
      { size: 'lg', variant: 'outline', loading: true },
      { loading: false },
      { loading: 'true' },
      { size: undefined },
      { size: null },
      { size: 'xxl' },
      { variant: 'solid', size: 'md' },
    ])
  })

  it('exposes the button variant map for splitting props', () => {
    expect(button.variantKeys).toEqual(['size', 'variant', 'loading'])
    expect(button.variantMap).toEqual({
      size: ['sm', 'md', 'lg'],
      variant: ['solid', 'outline', 'ghost'],
      loading: ['true'],
    })
    expect(button.splitVariantProps({ size: 'sm', onClick: 'fn', id: 'save' })).toEqual([
      { onClick: 'fn', id: 'save' },
      { size: 'sm' },
    ])
    expect(button.getVariantProps({ variant: 'ghost' })).toEqual({ size: 'md', variant: 'ghost' })
  })

  const input = cva({
    base: 'w_100% bd_1px_solid rounded_4px',
    variants: {
      size: { sm: 'h_8 fs_sm', md: 'h_10 fs_md' },
      invalid: { true: 'bd-c_red.500' },
      disabled: { true: 'opacity_0.5 cursor_not-allowed' },
    },
    defaultVariants: { size: 'md' },
  })

  it('renders an input in its error state', () => {
    expect(input({ invalid: true })).toBe('w_100% bd_1px_solid rounded_4px h_10 fs_md bd-c_red.500')
  })

  it('renders a disabled input at a non-default size', () => {
    expect(input({ size: 'sm', disabled: true })).toBe(
      'w_100% bd_1px_solid rounded_4px h_8 fs_sm opacity_0.5 cursor_not-allowed',
    )
  })

  it('agrees with raw across the input prop matrix', () => {
    agreesWithRaw(input, [
      {},
      { invalid: true },
      { invalid: false },
      { invalid: undefined },
      { size: 'sm', invalid: true, disabled: true },
      { disabled: 0 },
      { disabled: 1 },
    ])
  })

  const alert = cva({
    base: 'p_4 rounded_4px',
    variants: {
      status: { info: 'bg_blue.50', success: 'bg_green.50', warning: 'bg_orange.50', error: 'bg_red.50' },
      emphasis: { subtle: 'c_gray.800', solid: 'c_white' },
    },
    compoundVariants: [
      { status: 'error', emphasis: 'solid', css: 'bg_red.600' },
      { status: ['warning', 'error'], emphasis: 'subtle', css: 'bd-l_4px_solid' },
    ],
    defaultVariants: { status: 'info', emphasis: 'subtle' },
  })

  it('applies a compound variant when both conditions match', () => {
    expect(alert({ status: 'error', emphasis: 'solid' })).toBe('p_4 rounded_4px bg_red.600 c_white')
  })

  it('applies a compound variant declared with a list of values', () => {
    expect(alert({ status: 'warning' })).toBe('p_4 rounded_4px bg_orange.50 c_gray.800 bd-l_4px_solid')
    expect(alert({ status: 'success' })).toBe('p_4 rounded_4px bg_green.50 c_gray.800')
  })

  it('agrees with raw across the alert prop matrix', () => {
    agreesWithRaw(alert, [
      {},
      { status: 'error' },
      { status: 'error', emphasis: 'solid' },
      { status: 'warning', emphasis: 'subtle' },
      { status: undefined, emphasis: 'solid' },
    ])
  })

  it('renders a spacing scale keyed by number', () => {
    const stack = cva({
      base: 'd_flex flex-d_column',
      variants: {
        gap: { 1: 'gap_1', 2: 'gap_2', 4: 'gap_4' },
      },
      defaultVariants: { gap: 2 },
    })

    expect(stack()).toBe('d_flex flex-d_column gap_2')
    expect(stack({ gap: 4 })).toBe('d_flex flex-d_column gap_4')
    expect(stack({ gap: '4' })).toBe('d_flex flex-d_column gap_4')
    agreesWithRaw(stack, [{}, { gap: 1 }, { gap: '2' }, { gap: 4 }, { gap: 8 }, { gap: undefined }])
  })

  it('lets a later variant override a class the base already set', () => {
    const heading = cva({
      base: 'fs_md fw_400',
      variants: { level: { h1: 'fs_2xl fw_700', h2: 'fs_xl fw_600' } },
    })

    expect(heading({ level: 'h1' })).toBe('fs_2xl fw_700')
    expect(heading({ level: 'h2' })).toBe('fs_xl fw_600')
    expect(heading()).toBe('fs_md fw_400')
  })

  it('resolves a recipe wide enough to fall back to the memo path', () => {
    // 6 variants x 5 options is 46656 states — past the table ceiling
    const variants: Record<string, Record<string, string>> = {}
    for (let i = 0; i < 6; i++) {
      variants[`v${i}`] = { a: `a_${i}`, b: `b_${i}`, c: `c_${i}`, d: `d_${i}`, e: `e_${i}` }
    }
    const wide = cva({ base: 'base_x', variants })

    expect(wide({ v0: 'a', v5: 'e' })).toBe('base_x a_0 e_5')
    agreesWithRaw(wide, [{}, { v0: 'a' }, { v3: 'd', v4: 'e' }, { v0: undefined }])
  })

  it('composes a styled(Button, …) chain into one recipe', () => {
    const danger = button.merge(
      cva({
        base: 'bg_red.500',
        variants: { size: { sm: 'px_2' } },
        defaultVariants: { variant: 'outline' },
      }),
    )

    expect(danger.raw({ size: 'sm' })).toContain('px_2')
    expect(danger.raw({})).toContain('bg_red.500')
    agreesWithRaw(danger, [{}, { size: 'sm' }, { size: 'lg', loading: true }])
  })

  const card = sva({
    slots: ['root', 'header', 'body'],
    base: { root: 'rounded_8px bg_white', header: 'p_4 fw_600', body: 'p_4' },
    variants: {
      density: { compact: 'p_2', cozy: 'p_6' },
      raised: { true: 'shadow_md' },
    },
    defaultVariants: { density: 'cozy' },
  })

  it('renders every card slot with the shared variant applied', () => {
    expect(card()).toEqual({
      root: 'rounded_8px bg_white p_6',
      header: 'p_6 fw_600',
      body: 'p_6',
    })
  })

  it('renders a raised, compact card', () => {
    expect(card({ density: 'compact', raised: true })).toEqual({
      root: 'rounded_8px bg_white p_2 shadow_md',
      header: 'p_2 fw_600 shadow_md',
      body: 'p_2 shadow_md',
    })
  })

  it('agrees with raw across the card prop matrix', () => {
    for (const props of [{}, { raised: true }, { density: 'compact' }, { density: undefined }, { raised: false }]) {
      expect(card(props)).toEqual(card.raw(props))
    }
  })

  it('exposes card slot metadata for splitting props', () => {
    expect(card.variantKeys).toEqual(['density', 'raised'])
    expect(card.splitVariantProps({ raised: true, onClick: 'fn' })).toEqual([{ onClick: 'fn' }, { raised: true }])
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
