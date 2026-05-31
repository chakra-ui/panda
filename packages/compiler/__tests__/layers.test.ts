import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

describe('compiler.layers()', () => {
  it('returns the default cascade-layer names', () => {
    const compiler = createProject()
    expect(compiler.layers()).toEqual({
      reset: 'reset',
      base: 'base',
      tokens: 'tokens',
      recipes: 'recipes',
      utilities: 'utilities',
    })
  })

  it('reflects config overrides (defaults applied for omitted layers)', () => {
    const compiler = createProject({ layers: { utilities: 'panda-utilities' } })
    expect(compiler.layers()).toEqual({
      reset: 'reset',
      base: 'base',
      tokens: 'tokens',
      recipes: 'recipes',
      utilities: 'panda-utilities',
    })
  })
})
