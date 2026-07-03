import { describe, expect, it } from 'vitest'
import { SpecIndex } from '../../src/tooling'
import { createProject } from '../test-utils'

function createIndex() {
  const spec = createProject({
    theme: {
      tokens: {
        colors: { red: { value: '#f00' }, blue: { 500: { value: '#00f' } } },
      },
    },
    utilities: {
      color: { className: 'c', values: 'colors', shorthand: 'c' },
    },
    conditions: { hover: '&:hover' },
  }).spec()
  return new SpecIndex(spec)
}

describe('SpecIndex', () => {
  it('resolves an exact token value', () => {
    const index = createIndex()
    expect(index.resolveTokenValue('colors.red')).toBe('#f00')
    expect(index.resolveTokenValue('colors.blue.500')).toBe('#00f')
    expect(index.resolveTokenValue('colors.missing')).toBeUndefined()
  })

  it('lists token paths matching a prefix', () => {
    const index = createIndex()
    expect(index.resolveTokenPaths('colors.blue')).toEqual(['colors.blue.500'])
    expect(index.resolveTokenPaths()).toEqual(expect.arrayContaining(['colors.red', 'colors.blue.500']))
  })

  it('reports token deprecation', () => {
    const spec = createProject({
      theme: { tokens: { colors: { old: { value: '#000', deprecated: true } } } },
    }).spec()
    const index = new SpecIndex(spec)
    expect(index.resolveTokenDeprecation('colors.old')).toBe(true)
    expect(index.resolveTokenDeprecation('colors.red')).toBeUndefined()
  })

  it('checks whether a condition is defined', () => {
    const index = createIndex()
    expect(index.hasCondition('_hover')).toBe(true)
    expect(index.hasCondition('_focus')).toBe(false)
  })

  it('maps a utility property and its shorthand to a token category', () => {
    const index = createIndex()
    expect(index.resolveTokenCategoryForProperty('color')).toBe('colors')
    expect(index.resolveTokenCategoryForProperty('c')).toBe('colors')
    expect(index.resolveTokenCategoryForProperty('unknown')).toBeUndefined()
  })

  it('lists breakpoints and named conditions together as valid style-object keys', () => {
    const spec = createProject({
      theme: {
        breakpoints: { sm: '640px', md: '768px' },
      },
      conditions: { hover: '&:hover' },
    }).spec()
    const index = new SpecIndex(spec)

    expect(index.resolveStyleObjectKeys()).toEqual(expect.arrayContaining(['sm', 'md', '_hover']))
  })

  it('maps a utility property and its shorthand to its fixed literal values', () => {
    const spec = createProject({
      utilities: {
        scrollbar: { className: 'scr', values: ['visible', 'hidden'], shorthand: 'scr' },
      },
    }).spec()
    const index = new SpecIndex(spec)

    expect(index.resolveLiteralsForProperty('scrollbar')).toEqual(expect.arrayContaining(['visible', 'hidden']))
    expect(index.resolveLiteralsForProperty('scr')).toEqual(expect.arrayContaining(['visible', 'hidden']))
    expect(index.resolveLiteralsForProperty('unknown')).toBeUndefined()
  })

  it('lists keyframe names matching a prefix, for animationName-style properties', () => {
    const spec = createProject({
      theme: {
        keyframes: { spin: { from: {}, to: {} }, spinFast: { from: {}, to: {} }, fadeIn: { from: {}, to: {} } },
      },
    }).spec()
    const index = new SpecIndex(spec)

    expect(index.resolveKeyframeNames('spin')).toEqual(expect.arrayContaining(['spin', 'spinFast']))
    expect(index.resolveKeyframeNames()).toEqual(expect.arrayContaining(['spin', 'spinFast', 'fadeIn']))
  })
})
