import { describe, expect, it } from 'vitest'
import { completeSemanticTokenObject } from '../../src/tooling/config-semantic-tokens'
import { SpecIndex } from '../../src/tooling'
import { createProject } from '../test-utils'

function createIndex() {
  const spec = createProject({
    theme: {
      tokens: {
        colors: { red: { 500: { value: '#f00' } } },
        spacing: { 4: { value: '1rem' } },
      },
      breakpoints: { sm: '640px', md: '768px' },
    },
    conditions: { hover: '&:hover' },
  }).spec()
  return new SpecIndex(spec)
}

describe('a user starting a new category in defineSemanticTokens({...})', () => {
  it('sees every token category this config actually has', () => {
    const index = createIndex()
    const names = completeSemanticTokenObject({ cursorKind: 'category', existingKeys: [], prefix: '' }, index).map(
      (entry) => entry.name,
    )

    expect(names).toEqual(expect.arrayContaining(['colors', 'spacing']))
  })

  it("doesn't see a category they've already written", () => {
    const index = createIndex()
    const names = completeSemanticTokenObject(
      { cursorKind: 'category', existingKeys: ['colors'], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).not.toContain('colors')
  })

  it("only sees names matching what they've typed so far, e.g. 'sp'", () => {
    const index = createIndex()
    const names = completeSemanticTokenObject({ cursorKind: 'category', existingKeys: [], prefix: 'sp' }, index).map(
      (entry) => entry.name,
    )

    expect(names).toEqual(['spacing'])
  })
})

describe("a user filling in a token's conditional value object", () => {
  it("sees 'base' alongside named conditions and breakpoints", () => {
    const index = createIndex()
    const names = completeSemanticTokenObject({ cursorKind: 'condition', existingKeys: [], prefix: '' }, index).map(
      (entry) => entry.name,
    )

    expect(names).toEqual(expect.arrayContaining(['base', '_hover', 'sm', 'md']))
  })

  it("doesn't see a condition they've already written", () => {
    const index = createIndex()
    const names = completeSemanticTokenObject(
      { cursorKind: 'condition', existingKeys: ['base'], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).not.toContain('base')
  })
})
