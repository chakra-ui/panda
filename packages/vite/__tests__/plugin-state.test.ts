import { describe, expect, test } from 'vitest'
import { getRoot, type PluginState } from '../src/index'

// Lightweight mock Root for testing getRoot lookup logic
function mockRoot(name: string) {
  return { _name: name } as any
}

function createState(entries: [string, any][] = []): PluginState {
  return {
    roots: new Map(entries),
    server: null,
    config: null,
    viteUsesLightningCss: false,
  }
}

describe('getRoot', () => {
  test('returns exact envName match', () => {
    const ssr = mockRoot('ssr')
    const client = mockRoot('client')
    const state = createState([
      ['client', client],
      ['ssr', ssr],
    ])

    expect(getRoot(state, 'ssr')).toBe(ssr)
  })

  test('falls back to client when envName not found', () => {
    const client = mockRoot('client')
    const state = createState([['client', client]])

    expect(getRoot(state, 'unknown')).toBe(client)
  })

  test('falls back to client when no envName given', () => {
    const client = mockRoot('client')
    const state = createState([['client', client]])

    expect(getRoot(state)).toBe(client)
  })

  test('falls back to first available when no client root', () => {
    const ssr = mockRoot('ssr')
    const state = createState([['ssr', ssr]])

    expect(getRoot(state, 'unknown')).toBe(ssr)
  })

  test('returns undefined when no roots exist', () => {
    const state = createState()

    expect(getRoot(state)).toBeUndefined()
  })

  test('returns undefined when no roots and envName given', () => {
    const state = createState()

    expect(getRoot(state, 'client')).toBeUndefined()
  })
})
