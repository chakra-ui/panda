import { describe, expect, it } from 'vitest'
import { SpecIndex } from '../../src/tooling'
import { createProject } from '../test-utils'

describe('SpecIndex', () => {
  it('maps a utility property and its shorthand to a token category', () => {
    const spec = createProject({
      theme: {
        tokens: {
          colors: { red: { value: '#f00' } },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors', shorthand: 'c' },
      },
    }).spec()
    const index = new SpecIndex(spec)

    expect(index.resolveTokenCategoryForProperty('color')).toBe('colors')
    expect(index.resolveTokenCategoryForProperty('c')).toBe('colors')
    expect(index.resolveTokenCategoryForProperty('unknown')).toBeUndefined()
  })
})
