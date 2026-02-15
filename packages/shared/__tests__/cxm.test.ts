import { describe, test, expect } from 'vitest'
import { splitClassName, getMergeKey, cxm } from '../src'

describe('splitClassName', () => {
  test('simple — no conditions', () => {
    expect(splitClassName('c_red')).toEqual(['c_red'])
  })

  test('single condition', () => {
    expect(splitClassName('hover:c_red')).toEqual(['hover', 'c_red'])
  })

  test('multiple conditions', () => {
    expect(splitClassName('sm:hover:bg-c_green')).toEqual(['sm', 'hover', 'bg-c_green'])
  })

  test('many conditions', () => {
    expect(splitClassName('hover:disabled:sm:bg_red.300')).toEqual(['hover', 'disabled', 'sm', 'bg_red.300'])
  })

  test('bracket condition — pseudo-element', () => {
    expect(splitClassName('[&::placeholder]:c_red')).toEqual(['[&::placeholder]', 'c_red'])
  })

  test('bracket condition — nested brackets', () => {
    expect(splitClassName("[&[data-attr='test']]:c_green")).toEqual(["[&[data-attr='test']]", 'c_green'])
  })

  test('bracket condition + named condition', () => {
    expect(splitClassName("[&[data-attr='test']]:expanded:c_purple")).toEqual([
      "[&[data-attr='test']]",
      'expanded',
      'c_purple',
    ])
  })

  test('bracket condition — child selector', () => {
    expect(splitClassName('[&_>_p]:light:bg_red400')).toEqual(['[&_>_p]', 'light', 'bg_red400'])
  })

  test('no colons at all', () => {
    expect(splitClassName('px_4')).toEqual(['px_4'])
  })

  test('empty string', () => {
    expect(splitClassName('')).toEqual([])
  })
})

describe('getMergeKey', () => {
  test('simple property with default separator', () => {
    expect(getMergeKey('px_4', '_')).toBe('px')
  })

  test('property with hyphen in name', () => {
    expect(getMergeKey('bg-c_green', '_')).toBe('bg-c')
  })

  test('with single condition', () => {
    expect(getMergeKey('hover:c_red', '_')).toBe('hover:c')
  })

  test('with multiple conditions', () => {
    expect(getMergeKey('sm:hover:bg-c_green', '_')).toBe('sm:hover:bg-c')
  })

  test('strips important marker', () => {
    expect(getMergeKey('c_red!', '_')).toBe('c')
    expect(getMergeKey('op_0!', '_')).toBe('op')
  })

  test('important with conditions', () => {
    expect(getMergeKey('hover:c_red!', '_')).toBe('hover:c')
  })

  test('bracket condition', () => {
    expect(getMergeKey('[&::placeholder]:c_red', '_')).toBe('[&::placeholder]:c')
  })

  test('bracket condition + named condition', () => {
    expect(getMergeKey("[&[data-attr='test']]:expanded:c_purple", '_')).toBe("[&[data-attr='test']]:expanded:c")
  })

  test('non-panda class — no separator', () => {
    expect(getMergeKey('my-custom-class', '_')).toBeNull()
    expect(getMergeKey('btn', '_')).toBeNull()
  })

  test('starts with separator — not a panda class', () => {
    expect(getMergeKey('_hidden', '_')).toBeNull()
  })

  test('equals separator', () => {
    expect(getMergeKey('px=4', '=')).toBe('px')
    expect(getMergeKey('hover:px=4', '=')).toBe('hover:px')
  })

  test('dash separator', () => {
    expect(getMergeKey('px-4', '-')).toBe('px')
    expect(getMergeKey('hover:px-4', '-')).toBe('hover:px')
  })

  test('recipe variant class — has separator', () => {
    expect(getMergeKey('md:buttonStyle--size_md', '_')).toBe('md:buttonStyle--size')
  })
})

describe('cxm', () => {
  const _ = '_' // default separator

  test('same property — last wins', () => {
    expect(cxm(_, 'px_4', 'px_2')).toBe('px_2')
  })

  test('same property + same condition — last wins', () => {
    expect(cxm(_, 'hover:px_4', 'hover:px_2')).toBe('hover:px_2')
  })

  test('same property, different conditions — no conflict', () => {
    expect(cxm(_, 'px_4', 'hover:px_2')).toBe('px_4 hover:px_2')
  })

  test('different responsive conditions — no conflict', () => {
    expect(cxm(_, 'sm:c_red', 'md:c_blue')).toBe('sm:c_red md:c_blue')
  })

  test('different properties — no conflict', () => {
    expect(cxm(_, 'px_4', 'py_2')).toBe('px_4 py_2')
    expect(cxm(_, 'c_red', 'bg-c_blue')).toBe('c_red bg-c_blue')
  })

  test('important stripped for merge key — last wins', () => {
    expect(cxm(_, 'c_red!', 'c_blue')).toBe('c_blue')
  })

  test('different condition count — no conflict', () => {
    expect(cxm(_, 'hover:focus:c_red', 'hover:c_blue')).toBe('hover:focus:c_red hover:c_blue')
  })

  test('non-panda classes always kept', () => {
    expect(cxm(_, 'custom-class', 'px_4', 'custom-class')).toBe('custom-class px_4 custom-class')
  })

  test('falsy inputs ignored', () => {
    expect(cxm(_, 'px_4', null, undefined, '', false, 'mt_2')).toBe('px_4 mt_2')
  })

  test('multi-class strings', () => {
    // px_4 is overwritten by px_2, but stays in its original slot position
    expect(cxm(_, 'd_flex px_4', 'h_8 px_2')).toBe('d_flex px_2 h_8')
  })

  test('multi-class with multiple conflicts', () => {
    expect(cxm(_, 'd_flex px_4 mt_2', 'px_2 mt_4')).toBe('d_flex px_2 mt_4')
  })

  test('bracket conditions — same bracket = conflict', () => {
    expect(cxm(_, '[&::placeholder]:c_red', '[&::placeholder]:c_blue')).toBe('[&::placeholder]:c_blue')
  })

  test('bracket conditions — different bracket = no conflict', () => {
    expect(cxm(_, '[&::before]:c_red', '[&::after]:c_blue')).toBe('[&::before]:c_red [&::after]:c_blue')
  })

  test('condition order matters — different order = no conflict', () => {
    expect(cxm(_, 'hover:sm:c_red', 'sm:hover:c_blue')).toBe('hover:sm:c_red sm:hover:c_blue')
  })

  test('preserves insertion order — overwritten keys keep original position', () => {
    // c_red is first, c_blue overwrites it in the same slot
    expect(cxm(_, 'c_red', 'mt_4', 'px_2', 'c_blue')).toBe('c_blue mt_4 px_2')
  })

  test('no classes — empty string', () => {
    expect(cxm(_)).toBe('')
    expect(cxm(_, null, undefined, false)).toBe('')
  })

  test('single class — passthrough', () => {
    expect(cxm(_, 'px_4')).toBe('px_4')
  })

  test('non-panda classes mixed with panda', () => {
    // px_4 overwritten by px_2, stays in original slot; non-panda classes always appended
    expect(cxm(_, 'btn', 'px_4', 'my-class', 'px_2')).toBe('btn px_2 my-class')
  })

  test('equals separator', () => {
    expect(cxm('=', 'px=4', 'px=2')).toBe('px=2')
    expect(cxm('=', 'hover:px=4', 'hover:px=2')).toBe('hover:px=2')
    expect(cxm('=', 'px=4', 'py=2')).toBe('px=4 py=2')
  })

  test('dash separator', () => {
    expect(cxm('-', 'px-4', 'px-2')).toBe('px-2')
    expect(cxm('-', 'hover:px-4', 'hover:px-2')).toBe('hover:px-2')
    expect(cxm('-', 'px-4', 'py-2')).toBe('px-4 py-2')
  })

  test('real-world: cva base + variant merge', () => {
    // base: d_flex px_4, variant: h_8 fs_sm px_2
    // px_4 overwritten by px_2 in original slot
    expect(cxm(_, 'd_flex px_4', 'h_8 fs_sm px_2')).toBe('d_flex px_2 h_8 fs_sm')
  })

  test('real-world: sva slot merge', () => {
    expect(cxm(_, 'p_4', 'p_2')).toBe('p_2')
  })

  test('real-world: JSX className merge', () => {
    expect(cxm(_, 'mt_4 c_red', 'c_blue.500')).toBe('mt_4 c_blue.500')
  })

  test('hashed classNames — falls back to concatenation', () => {
    expect(cxm(_, 'cPbUdN', 'xYz123')).toBe('cPbUdN xYz123')
  })
})
