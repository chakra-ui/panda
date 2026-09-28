import { describe, expect, it } from 'vitest'
import { memoRecipe } from '../src/runtime/internal/memo'

type Props = Record<string, unknown>

interface Spec {
  variants: Record<string, Record<string, string>>
  defaultVariants?: Record<string, unknown>
  compoundVariants?: Array<Record<string, unknown> & { className: string }>
}

/** Same semantics as a compiled recipe: lookups coerce the prop to a key, compounds compare strictly. */
function compiled(spec: Spec) {
  let calls = 0
  const resolve = (props: Props = {}) => {
    calls++
    props ??= {}
    const classes: string[] = []
    const selected: Props = {}
    for (const key in spec.variants) {
      const value = props[key] === undefined ? spec.defaultVariants?.[key] : props[key]
      selected[key] = value
      const cls = spec.variants[key]![value as string]
      if (cls) classes.push(cls)
    }
    for (const { className, ...conditions } of spec.compoundVariants ?? []) {
      const matches = Object.entries(conditions).every(([key, expected]) =>
        Array.isArray(expected) ? expected.includes(selected[key]) : selected[key] === expected,
      )
      if (matches) classes.push(className)
    }
    return classes.join(' ')
  }
  const variantMap = Object.fromEntries(Object.entries(spec.variants).map(([key, group]) => [key, Object.keys(group)]))
  return { resolve, variantMap, calls: () => calls }
}

const button: Spec = {
  variants: {
    size: { sm: 'fs_sm', md: 'fs_md', lg: 'fs_lg' },
    tone: { solid: 'bg_blue', ghost: 'bg_none' },
    disabled: { true: 'op_0.5', false: 'op_1' },
  },
  defaultVariants: { size: 'md', tone: 'solid' },
}

const withCompounds: Spec = {
  ...button,
  compoundVariants: [
    { size: 'sm', tone: 'ghost', className: 'td_underline' },
    { disabled: true, className: 'cur_not-allowed' },
    { size: ['md', 'lg'], tone: 'solid', className: 'fw_bold' },
  ],
}

function seeded(seed: number) {
  return () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32
}

describe('memoRecipe', () => {
  it('returns the resolved classes', () => {
    const { resolve, variantMap } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({ size: 'lg', tone: 'ghost' })).toMatchInlineSnapshot(`"fs_lg bg_none"`)
  })

  it('resolves a repeated prop tuple once', () => {
    const { resolve, variantMap, calls } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    for (let i = 0; i < 5; i++) recipe({ size: 'sm', tone: 'ghost' })
    expect(calls()).toBe(1)
  })

  it('returns the same object for a repeated slot recipe call', () => {
    const recipe = memoRecipe((props: Props = {}) => ({ root: `size_${props.size}` }), { size: ['sm', 'md'] })
    expect(recipe({ size: 'sm' })).toBe(recipe({ size: 'sm' }))
  })

  it('resolves a call without props once, whether it passes nothing, undefined, or null', () => {
    const { resolve, variantMap, calls } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    const loose = recipe as (props?: unknown) => string
    expect(loose()).toMatchInlineSnapshot(`"fs_md bg_blue"`)
    expect(loose(undefined)).toBe(loose())
    expect(loose(null)).toBe(loose())
    expect(calls()).toBe(1)
  })

  it('treats an empty props object like the defaults', () => {
    const { resolve, variantMap } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({})).toBe(resolve({}))
    expect(recipe({ size: undefined })).toBe(resolve({}))
  })

  it('keeps null apart from undefined', () => {
    const { resolve, variantMap } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({ size: undefined })).toMatchInlineSnapshot(`"fs_md bg_blue"`)
    expect(recipe({ size: null })).toMatchInlineSnapshot(`"bg_blue"`)
    expect(recipe({ size: undefined })).toMatchInlineSnapshot(`"fs_md bg_blue"`)
  })

  it('keeps each falsy prop kind apart', () => {
    const { resolve, variantMap } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    for (const value of [false, 0, '', null, undefined, Number.NaN]) {
      expect(recipe({ disabled: value })).toBe(resolve({ disabled: value }))
    }
  })

  it('shares a slot between a boolean and the key it coerces to when there are no compounds', () => {
    const { resolve, variantMap, calls } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({ disabled: true })).toMatchInlineSnapshot(`"fs_md bg_blue op_0.5"`)
    expect(recipe({ disabled: 'true' })).toBe(recipe({ disabled: true }))
    expect(calls()).toBe(1)
  })

  it('keeps a boolean and its string apart when a compound compares them strictly', () => {
    const { resolve, variantMap } = compiled(withCompounds)
    const recipe = memoRecipe(resolve, variantMap, withCompounds.compoundVariants!.length)
    expect(recipe({ disabled: true })).toMatchInlineSnapshot(`"fs_md bg_blue op_0.5 cur_not-allowed fw_bold"`)
    expect(recipe({ disabled: 'true' })).toMatchInlineSnapshot(`"fs_md bg_blue op_0.5 fw_bold"`)
  })

  it('caches an undeclared false or null instead of resolving it every time', () => {
    const { resolve, variantMap, calls } = compiled({ variants: { disabled: { true: 'op_0.5' } } })
    const recipe = memoRecipe(resolve, variantMap)
    for (let i = 0; i < 3; i++) {
      expect(recipe({ disabled: false })).toBe('')
      expect(recipe({ disabled: null })).toBe('')
    }
    expect(calls()).toBe(2)
  })

  it('shares a slot between null and the string it coerces to', () => {
    const { resolve, variantMap, calls } = compiled({ variants: { tone: { null: 'c_gray', solid: 'c_blue' } } })
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({ tone: null })).toBe('c_gray')
    expect(recipe({ tone: 'null' })).toBe('c_gray')
    expect(calls()).toBe(1)
  })

  it('resolves an unknown option without caching it', () => {
    const { resolve, variantMap, calls } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({ size: 'xl' })).toMatchInlineSnapshot(`"bg_blue"`)
    recipe({ size: 'xl' })
    expect(calls()).toBe(2)
  })

  it('never serves a stale result for a mutated object prop', () => {
    const lookup = (props: Props = {}) => `size_${String(props.size)}`
    const recipe = memoRecipe(lookup, { size: ['sm', 'md'] })
    const size = { toString: () => 'sm' }
    expect(recipe({ size })).toBe('size_sm')
    size.toString = () => 'md'
    expect(recipe({ size })).toBe('size_md')
  })

  it('never serves a stale result for a mutated array prop on the ring path', () => {
    const lookup = (props: Props = {}) => `size_${String(props.size)}`
    const recipe = memoRecipe(lookup, { size: ['sm', 'md'] }, 1)
    const size = ['sm']
    expect(recipe({ size })).toBe('size_sm')
    size[0] = 'md'
    expect(recipe({ size })).toBe('size_md')
  })

  it('ignores props the recipe does not declare', () => {
    const { resolve, variantMap, calls } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    recipe({ size: 'sm', onClick: () => {} })
    recipe({ size: 'sm', id: 'save' })
    expect(calls()).toBe(1)
  })

  it('stays correct with more combinations than the ring holds', () => {
    const { resolve, variantMap } = compiled(withCompounds)
    const recipe = memoRecipe(resolve, variantMap, 1)
    const tuples: Props[] = []
    for (const size of ['sm', 'md', 'lg', undefined]) {
      for (const tone of ['solid', 'ghost', undefined]) {
        for (const disabled of [true, false, undefined]) tuples.push({ size, tone, disabled })
      }
    }
    for (let round = 0; round < 3; round++) {
      for (const props of tuples) expect(recipe(props)).toBe(resolve(props))
    }
  })

  it('falls back to the ring when the combination table would be too large', () => {
    const variants = Object.fromEntries(
      Array.from({ length: 5 }, (_, g) => [
        `g${g}`,
        Object.fromEntries(Array.from({ length: 5 }, (_, o) => [`o${o}`, `g${g}_o${o}`])),
      ]),
    )
    const { resolve, variantMap } = compiled({ variants })
    const recipe = memoRecipe(resolve, variantMap)
    expect(recipe({ g0: 'o1', g4: 'o3' })).toMatchInlineSnapshot(`"g0_o1 g4_o3"`)
    expect(recipe({ g0: 'o1', g4: 'o3' })).toBe(resolve({ g0: 'o1', g4: 'o3' }))
  })

  it('returns the resolver itself when the recipe has no variants', () => {
    const resolve = () => 'd_flex'
    expect(memoRecipe(resolve, {})).toBe(resolve)
  })

  it('keeps separate state per recipe', () => {
    const first = memoRecipe((props: Props = {}) => `a_${String(props.size)}`, { size: ['sm'] })
    const second = memoRecipe((props: Props = {}) => `b_${String(props.size)}`, { size: ['sm'] })
    expect(first({ size: 'sm' })).toBe('a_sm')
    expect(second({ size: 'sm' })).toBe('b_sm')
  })
})

describe('memoRecipe matches the unmemoized recipe', () => {
  const values = ['sm', 'md', 'lg', 'xl', 'solid', 'ghost', true, false, 'true', 'false', 0, 1, '', null, undefined]

  function randomProps(random: () => number): Props {
    const props: Props = {}
    for (const key of ['size', 'tone', 'disabled', 'extra']) {
      if (random() < 0.3) continue
      props[key] = values[Math.floor(random() * values.length)]
    }
    return props
  }

  it('agrees on the table path for 20,000 seeded calls', () => {
    const random = seeded(0xbeef)
    const { resolve, variantMap } = compiled(button)
    const recipe = memoRecipe(resolve, variantMap)
    const pool = Array.from({ length: 300 }, () => randomProps(random))
    for (let i = 0; i < 20_000; i++) {
      const props = pool[Math.floor(random() * pool.length)]!
      expect(recipe(props)).toBe(resolve(props))
    }
  })

  it('agrees on the strict table path for 20,000 seeded calls', () => {
    const random = seeded(0xfeed)
    const { resolve, variantMap } = compiled(withCompounds)
    const recipe = memoRecipe(resolve, variantMap, withCompounds.compoundVariants!.length)
    const pool = Array.from({ length: 300 }, () => randomProps(random))
    for (let i = 0; i < 20_000; i++) {
      const props = pool[Math.floor(random() * pool.length)]!
      expect(recipe(props)).toBe(resolve(props))
    }
  })

  it('agrees on the ring path for 20,000 seeded calls', () => {
    const random = seeded(0xface)
    const wide: Spec = {
      variants: {
        ...withCompounds.variants,
        tone: { solid: 'bg_blue', ghost: 'bg_none', outline: 'bdw_1', link: 'td_u', soft: 'bg_soft' },
        density: { compact: 'p_1', cozy: 'p_2', roomy: 'p_4' },
      },
      compoundVariants: withCompounds.compoundVariants,
    }
    const { resolve, variantMap } = compiled(wide)
    const recipe = memoRecipe(resolve, variantMap, 1)
    const pool = Array.from({ length: 300 }, () => {
      const props = randomProps(random)
      if (random() < 0.7) props.density = ['compact', 'cozy', 'roomy', true, null][Math.floor(random() * 5)]
      return props
    })
    for (let i = 0; i < 20_000; i++) {
      const props = pool[Math.floor(random() * pool.length)]!
      expect(recipe(props)).toBe(resolve(props))
    }
  })
})
