import * as defineEntry from '@pandacss/dev/define'
import * as rootEntry from '@pandacss/dev'
import { describe, expect, test } from 'vitest'

describe('@pandacss/dev/define', () => {
  test('preserves root helper exports', () => {
    expect(defineEntry.definePattern).toBe(rootEntry.definePattern)
    expect(defineEntry.defineTokens).toBe(rootEntry.defineTokens)

    const defineParts = rootEntry.defineParts({ root: { selector: '&' } })
    expect(defineParts({ root: { color: 'red' } })).toEqual({ '&': { color: 'red' } })
  })

  test('supports flat and namespaced token definitions', () => {
    const flat = { colors: { red: { value: '#f00' } } }
    const colors = { red: { value: '#f00' } }

    expect(defineEntry.defineTokens(flat)).toBe(flat)
    expect(defineEntry.defineTokens.colors(colors)).toBe(colors)
  })

  test('supports flat and namespaced semantic token definitions', () => {
    const flat = { colors: { text: { value: '{colors.gray.900}' } } }
    const colors = { text: { value: '{colors.gray.900}' } }

    expect(defineEntry.defineSemanticTokens(flat)).toBe(flat)
    expect(defineEntry.defineSemanticTokens.colors(colors)).toBe(colors)
  })
})
