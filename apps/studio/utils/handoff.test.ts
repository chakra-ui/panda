import { sealSpec } from '@pandacss/compiler-shared'
import { describe, expect, it } from 'vitest'
import { readHandoff, receiveHandoff } from './handoff'

const json = JSON.stringify({ schemaVersion: 1, paths: ['colors.brand'] })
const respond = (status: number, body?: unknown) => async () => new Response(JSON.stringify(body ?? {}), { status })

describe('readHandoff', () => {
  it('reads the id from the query and the key from the fragment', () => {
    expect(readHandoff({ search: '?h=abc', hash: '#k=xyz' })).toEqual({ id: 'abc', key: 'xyz' })
  })

  it('needs the id', () => {
    expect(readHandoff({ search: '', hash: '#k=xyz' })).toBeNull()
  })

  it('reports a missing key', () => {
    expect(readHandoff({ search: '?h=abc', hash: '' })).toEqual({ id: 'abc', key: null })
  })
})

describe('receiveHandoff', () => {
  it('decrypts the stored spec', async () => {
    const { sealed, key } = await sealSpec(json)
    expect(await receiveHandoff('abc', key, respond(200, sealed))).toBe(json)
  })

  it('returns null when the handoff is gone', async () => {
    expect(await receiveHandoff('abc', 'xyz', respond(404))).toBeNull()
  })

  it('returns null for the wrong key', async () => {
    const { sealed } = await sealSpec(json)
    const { key } = await sealSpec(json)
    expect(await receiveHandoff('abc', key, respond(200, sealed))).toBeNull()
  })

  it('returns null when the request fails', async () => {
    const failing = async () => {
      throw new TypeError('offline')
    }
    expect(await receiveHandoff('abc', 'xyz', failing)).toBeNull()
  })

  it('returns null when the body is not JSON', async () => {
    const html = async () => new Response('<html>', { status: 200 })
    expect(await receiveHandoff('abc', 'xyz', html)).toBeNull()
  })
})
