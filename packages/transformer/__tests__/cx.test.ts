import { describe, expect, it } from 'vitest'
import { createCx, cx, getMergeKey, type PandaClassPart } from '../src/runtime/internal/cx'

/** The obvious, uncached algorithm: split on whitespace, first position keeps the slot, last value wins. */
function referenceCx(separator: string, ...parts: PandaClassPart[]): string {
  const flat: string[] = []
  const collect = (value: PandaClassPart) => {
    if (!value) return
    if (typeof value === 'string') flat.push(value)
    else if (Array.isArray(value)) value.forEach(collect)
  }
  parts.forEach(collect)
  if (flat.length === 0) return ''
  if (flat.length === 1) return flat[0]!
  const out: string[] = []
  const slots = new Map<string, number>()
  for (const token of flat.join(' ').split(/[ \t\n\v\f\r]+/)) {
    if (!token) continue
    const key = getMergeKey(token, separator)
    const slot = key === null ? undefined : slots.get(key)
    if (slot !== undefined) out[slot] = token
    else {
      if (key !== null) slots.set(key, out.length)
      out.push(token)
    }
  }
  return out.join(' ')
}

function seeded(seed: number) {
  return () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32
}

describe('cx joining', () => {
  it('joins parts with a single space', () => {
    expect(cx('d_flex', 'px_4', 'c_red')).toMatchInlineSnapshot(`"d_flex px_4 c_red"`)
  })

  it('returns an empty string with no arguments', () => {
    expect(cx()).toMatchInlineSnapshot(`""`)
  })

  it('skips falsy parts at every position', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toMatchInlineSnapshot(`"a b"`)
    expect(cx(false, 'a', 'b')).toMatchInlineSnapshot(`"a b"`)
    expect(cx('a', 'b', null)).toMatchInlineSnapshot(`"a b"`)
    expect(cx(false, null, undefined, '')).toMatchInlineSnapshot(`""`)
  })

  it('flattens nested arrays and skips empty ones', () => {
    expect(cx('a', ['b', ['c', ['d']]], [])).toMatchInlineSnapshot(`"a b c d"`)
    expect(cx([], [[]], [false, null])).toMatchInlineSnapshot(`""`)
  })

  it('ignores values that are not class strings', () => {
    const loose = cx as (...parts: unknown[]) => string
    expect(loose('a', 0, 5, true, { b: true }, 'c')).toMatchInlineSnapshot(`"a c"`)
  })

  it('gives the same result whatever falsy padding surrounds the parts', () => {
    const direct = cx('d_flex px_2', 'px_4')
    expect(direct).toMatchInlineSnapshot(`"d_flex px_4"`)
    expect(cx('d_flex px_2', false, 'px_4')).toBe(direct)
    expect(cx('d_flex px_2', 'px_4', null)).toBe(direct)
    expect(cx(undefined, 'd_flex px_2', '', 'px_4', false)).toBe(direct)
    expect(cx(['d_flex px_2'], ['px_4'])).toBe(direct)
  })
})

describe('cx lone class strings', () => {
  it('returns a lone class string untouched', () => {
    // Producers emit conflict-free strings, so there is nothing to merge and
    // the transform's `cx(staticClasses, props.className)` stays cheap when no
    // `className` is passed through.
    expect(cx('d_flex px_4', undefined)).toMatchInlineSnapshot(`"d_flex px_4"`)
    expect(cx([false, 'd_flex px_4'])).toMatchInlineSnapshot(`"d_flex px_4"`)
  })

  it('does not rewrite the spacing of a lone string', () => {
    expect(cx('  d_flex   px_4 ')).toMatchInlineSnapshot(`"  d_flex   px_4 "`)
  })
})

describe('cx conflicts', () => {
  it('merges conflicting panda utilities with last-wins semantics', () => {
    expect(cx('px_4', 'px_2')).toMatchInlineSnapshot(`"px_2"`)
    expect(cx('hover:px_4', 'hover:px_2')).toMatchInlineSnapshot(`"hover:px_2"`)
    expect(cx('mt_4 c_red', 'c_blue.500')).toMatchInlineSnapshot(`"mt_4 c_blue.500"`)
  })

  it('keeps the first position of a slot and the last value for it', () => {
    expect(cx('c_red d_flex', 'px_4', 'c_blue')).toMatchInlineSnapshot(`"c_blue d_flex px_4"`)
  })

  it('resolves a conflict inside one part', () => {
    expect(cx('px_2 px_4', 'd_flex')).toMatchInlineSnapshot(`"px_4 d_flex"`)
  })

  it('resolves three-way and repeated conflicts', () => {
    expect(cx('c_red', 'c_green', 'c_blue')).toMatchInlineSnapshot(`"c_blue"`)
    expect(cx('px_2', 'px_2', 'px_2')).toMatchInlineSnapshot(`"px_2"`)
    expect(cx('d_flex', 'd_flex px_2', false, 'd_flex')).toMatchInlineSnapshot(`"d_flex px_2"`)
  })

  it('treats each condition chain as its own slot', () => {
    expect(cx('c_red hover:c_red md:c_red', 'hover:c_blue')).toMatchInlineSnapshot(`"c_red hover:c_blue md:c_red"`)
    expect(cx('md:hover:c_red', 'hover:md:c_blue')).toMatchInlineSnapshot(`"md:hover:c_red hover:md:c_blue"`)
  })

  it('ignores colons inside bracketed selectors when finding the property', () => {
    expect(cx('[&:hover]:c_red', '[&:hover]:c_blue')).toMatchInlineSnapshot(`"[&:hover]:c_blue"`)
    expect(cx('[@media_(min-width:0)]:c_red', '[@media_(min-width:0)]:c_blue')).toMatchInlineSnapshot(
      `"[@media_(min-width:0)]:c_blue"`,
    )
    expect(cx('[&[data-open]]:c_red [&>*]:c_red', '[&>*]:c_blue')).toMatchInlineSnapshot(
      `"[&[data-open]]:c_red [&>*]:c_blue"`,
    )
  })

  it('keys a value that itself contains the separator by its property only', () => {
    expect(cx('w_calc(100%_-_2px)', 'w_full')).toMatchInlineSnapshot(`"w_full"`)
    expect(cx('bg_#fff', 'bg_#000')).toMatchInlineSnapshot(`"bg_#000"`)
  })

  it('treats an important class as the same slot as its plain form', () => {
    expect(cx('c_red!', 'c_blue')).toMatchInlineSnapshot(`"c_blue"`)
    expect(cx('c_red', 'c_blue!')).toMatchInlineSnapshot(`"c_blue!"`)
  })

  it('keeps classes Panda does not own, duplicates included', () => {
    expect(cx('custom', 'custom')).toMatchInlineSnapshot(`"custom custom"`)
    expect(cx('btn', 'px_4', 'btn', 'px_2')).toMatchInlineSnapshot(`"btn px_2 btn"`)
    expect(cx('_leading', 'trailing_', '!', 'hover:', 'x_y')).toMatchInlineSnapshot(`"_leading trailing_ ! hover: x_y"`)
  })
})

describe('cx whitespace', () => {
  it('splits merged parts on any ASCII whitespace', () => {
    expect(cx('d_flex\npx_2', 'px_4')).toMatchInlineSnapshot(`"d_flex px_4"`)
    expect(cx('d_flex\tpx_2\r\n', 'px_4')).toMatchInlineSnapshot(`"d_flex px_4"`)
  })

  it('normalizes leading, trailing, and repeated spaces once it merges', () => {
    expect(cx('  d_flex  px_2 ', ' ', '   py_4  ')).toMatchInlineSnapshot(`"d_flex px_2 py_4"`)
    expect(cx(' d_flex', 'px_2 ')).toMatchInlineSnapshot(`"d_flex px_2"`)
  })

  it('drops whitespace-only parts', () => {
    expect(cx('d_flex', '   ', 'px_2')).toMatchInlineSnapshot(`"d_flex px_2"`)
    expect(cx('  ', '\n')).toMatchInlineSnapshot(`""`)
  })
})

describe('cx separators', () => {
  it('merges with a custom separator', () => {
    const cxEquals = createCx({ separator: '=' })
    expect(cxEquals('c=red d=flex', 'c=blue')).toMatchInlineSnapshot(`"c=blue d=flex"`)
    expect(cxEquals('c_red', 'c_blue')).toMatchInlineSnapshot(`"c_red c_blue"`)
  })

  it('keeps separate caches per separator', () => {
    const underscore = createCx({ separator: '_' })
    const equals = createCx({ separator: '=' })
    expect(underscore('c_red', 'c_blue')).toMatchInlineSnapshot(`"c_blue"`)
    expect(equals('c_red', 'c_blue')).toMatchInlineSnapshot(`"c_red c_blue"`)
    expect(underscore('c_red', 'c_blue')).toMatchInlineSnapshot(`"c_blue"`)
  })
})

describe('cx caches', () => {
  it('checks every leading part, not only the last one', () => {
    const merge = createCx()
    for (let round = 0; round < 3; round++) {
      expect(merge('c_red', 'd_flex', 'px_4')).toBe('c_red d_flex px_4')
      expect(merge('c_blue', 'd_block', 'px_4')).toBe('c_blue d_block px_4')
      expect(merge('c_red', 'd_block', 'px_4')).toBe('c_red d_block px_4')
      expect(merge('px_2', 'px_4')).toBe('px_4')
    }
  })

  it('does not confuse calls with the same parts in a different order', () => {
    const merge = createCx()
    for (let round = 0; round < 3; round++) {
      expect(merge('px_2', 'px_4', 'd_flex')).toBe('px_4 d_flex')
      expect(merge('px_4', 'px_2', 'd_flex')).toBe('px_2 d_flex')
    }
  })

  it('stays correct when many calls share the same last part', () => {
    const merge = createCx()
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 40; i++) expect(merge(`mt_${i}px`, 'mt_0')).toBe('mt_0')
      for (let i = 0; i < 40; i++) expect(merge(`c_${i}`, 'mt_0')).toBe(`c_${i} mt_0`)
    }
  })

  it('stays correct after the caches rotate through thousands of unique inputs', () => {
    const merge = createCx()
    const replay = () => {
      expect(merge('c_red px_2', 'px_4')).toBe('c_red px_4')
      expect(merge('hover:c_red', 'hover:c_blue', 'd_flex')).toBe('hover:c_blue d_flex')
    }
    replay()
    for (let i = 0; i < 5000; i++) expect(merge(`c_a${i}`, `c_b${i}`)).toBe(`c_b${i}`)
    replay()
    for (let i = 0; i < 5000; i++) expect(merge(`w_${i} mt_${i}`, `mt_0`)).toBe(`w_${i} mt_0`)
    replay()
  })

  it('gives the same result for a part on its first, second, and later sightings', () => {
    const merge = createCx()
    for (let round = 0; round < 4; round++) {
      expect(merge('c_red d_flex', 'c_blue')).toBe('c_blue d_flex')
      expect(merge('px_2 hover:c_red', 'hover:c_blue px_4')).toBe('px_4 hover:c_blue')
    }
  })

  it('reuses a cached part inside a new combination', () => {
    const merge = createCx()
    expect(merge('d_flex px_2', 'c_red')).toBe('d_flex px_2 c_red')
    expect(merge('c_blue', 'd_flex px_2', 'px_4')).toBe('c_blue d_flex px_4')
    expect(merge('d_flex px_2', 'd_block')).toBe('d_block px_2')
  })

  it('keeps earlier parts intact when a later part grows the scratch buffers', () => {
    const long = Array.from({ length: 200 }, (_, i) => `m${i}_1`).join(' ')
    expect(createCx()('btn', 'c_red d_flex', `${long} c_blue`)).toBe(`btn c_blue d_flex ${long}`)
  })

  it('merges inputs larger than its scratch buffers', () => {
    const merge = createCx()
    const many = Array.from({ length: 300 }, (_, i) => `p${i}_1`).join(' ')
    const overrides = Array.from({ length: 300 }, (_, i) => `p${i}_2`).join(' ')
    expect(merge(many, overrides)).toBe(overrides)
    const parts = Array.from({ length: 150 }, (_, i) => `c_${i}`)
    expect(merge(...parts)).toBe('c_149')
  })
})

describe('cx matches the uncached reference', () => {
  const vocabulary = [
    'c_red',
    'c_blue',
    'c_red!',
    'hover:c_red',
    'hover:c_blue',
    'md:hover:c_red',
    'hover:md:c_red',
    '[&:hover]:c_red',
    '[&:hover]:c_green',
    'px_2',
    'px_4',
    'd_flex',
    'd_block',
    'w_calc(100%_-_2px)',
    'bg_#fff',
    'custom',
    'btn',
    '_leading',
    'x',
  ]
  const spacing = [' ', ' ', ' ', '  ', '\n', '\t']

  function randomPart(random: () => number): PandaClassPart {
    const roll = random()
    if (roll < 0.08) return [false, null, undefined, ''][Math.floor(random() * 4)] as PandaClassPart
    const tokenCount = 1 + Math.floor(random() * 4)
    let part = ''
    for (let i = 0; i < tokenCount; i++) {
      if (i > 0 || random() < 0.05) part += spacing[Math.floor(random() * spacing.length)]
      part += vocabulary[Math.floor(random() * vocabulary.length)]
    }
    if (random() < 0.05) part += ' '
    return roll < 0.15 ? [part, random() < 0.5 ? false : 'd_grid'] : part
  }

  it('agrees on 20,000 seeded calls, replayed to exercise every cache path', () => {
    const random = seeded(0xc0ffee)
    const calls = Array.from({ length: 400 }, () =>
      Array.from({ length: 1 + Math.floor(random() * 5) }, () => randomPart(random)),
    )
    const merge = createCx()
    for (let i = 0; i < 20_000; i++) {
      const parts = calls[Math.floor(random() * calls.length)]!
      expect(merge(...parts)).toBe(referenceCx('_', ...parts))
    }
  })
})

describe('getMergeKey', () => {
  it('reads conditions and property up to the separator', () => {
    expect(getMergeKey('c_red', '_')).toMatchInlineSnapshot(`"c"`)
    expect(getMergeKey('md:hover:bg_red', '_')).toMatchInlineSnapshot(`"md:hover:bg"`)
    expect(getMergeKey('[&:hover]:c_red', '_')).toMatchInlineSnapshot(`"[&:hover]:c"`)
    expect(getMergeKey('c_red!', '_')).toMatchInlineSnapshot(`"c"`)
  })

  it('returns null for classes Panda does not own', () => {
    expect(getMergeKey('custom', '_')).toBeNull()
    expect(getMergeKey('_leading', '_')).toBeNull()
    expect(getMergeKey('!', '_')).toBeNull()
    expect(getMergeKey('', '_')).toBeNull()
  })

  it('keys a class with an empty value by its property', () => {
    expect(getMergeKey('trailing_', '_')).toMatchInlineSnapshot(`"trailing"`)
  })
})
