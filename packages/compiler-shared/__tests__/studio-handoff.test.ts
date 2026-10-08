import { describe, expect, it } from 'vitest'
import { decodeSpec, encodeSpec } from '../src/studio-handoff'

const json = JSON.stringify({ schemaVersion: 1, paths: ['colors.brand'], big: 'x'.repeat(200_000) })

describe('studio handoff', () => {
  it('round-trips a spec', async () => {
    expect(await decodeSpec(await encodeSpec(json))).toBe(json)
  })

  it('compresses and encodes as base64url', async () => {
    const encoded = await encodeSpec(json)
    expect(encoded.length).toBeLessThan(json.length / 10)
    expect(encoded).toMatch(/^[\w-]+$/)
  })

  it('rejects a cut-off value', async () => {
    const encoded = await encodeSpec(json)
    await expect(decodeSpec(encoded.slice(0, encoded.length / 2))).rejects.toThrow()
  })

  it('rejects a value that is not base64url', async () => {
    await expect(decodeSpec('not base64!')).rejects.toThrow()
  })
})
