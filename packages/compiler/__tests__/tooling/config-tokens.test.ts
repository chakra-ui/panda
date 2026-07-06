import { describe, expect, it } from 'vitest'
import { completeConfigTokenPath, findConfigTokenRefAt, findConfigTokenRefs } from '../../src/tooling/config-tokens'
import { SpecIndex } from '../../src/tooling'
import { createProject } from '../test-utils'

describe('recognizing a token reference the user wrote in a style value', () => {
  it("recognizes '{colors.red.500}' as a token reference", () => {
    const text = '{colors.red.500}'
    expect(findConfigTokenRefs(text)).toEqual([
      { start: 0, end: 16, pathStart: 1, pathEnd: 15, path: 'colors.red.500' },
    ])
  })

  it("recognizes multiple references in one value, e.g. '1px solid {colors.red.500}, {colors.blue.500}'", () => {
    const text = '1px solid {colors.red.500}, {colors.blue.500}'
    expect(findConfigTokenRefs(text).map((ref) => ref.path)).toEqual(['colors.red.500', 'colors.blue.500'])
  })

  it("doesn't mistake a plain value like '1rem' for a token reference", () => {
    expect(findConfigTokenRefs('1rem')).toEqual([])
  })

  it("doesn't mistake an object shorthand like '{ colors: red }' for a token reference", () => {
    expect(findConfigTokenRefs('{ colors: red }')).toEqual([])
  })
})

describe("telling which reference the user's cursor is inside", () => {
  it('finds the reference the cursor is inside', () => {
    const text = '1px solid {colors.red.500}'
    expect(findConfigTokenRefAt(text, 15)?.path).toBe('colors.red.500')
  })

  it("reports nothing if the cursor isn't inside a reference", () => {
    const text = '1px solid {colors.red.500}'
    expect(findConfigTokenRefAt(text, 3)).toBeUndefined()
  })
})

describe('suggesting token paths while the user types', () => {
  it('suggests real token paths matching what they typed, skipping deprecated ones', () => {
    const spec = createProject({
      theme: {
        tokens: {
          colors: {
            red: { 500: { value: '#f00' } },
            old: { value: '#000', deprecated: true },
          },
        },
      },
    }).spec()
    const index = new SpecIndex(spec)

    expect(completeConfigTokenPath('colors', index)).toEqual(expect.arrayContaining(['colors.red.500']))
    expect(completeConfigTokenPath('colors', index)).not.toEqual(expect.arrayContaining(['colors.old']))
  })
})
