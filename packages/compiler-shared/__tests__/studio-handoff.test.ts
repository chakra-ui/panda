import { describe, expect, it } from 'vitest'
import { openSpec, sealSpec } from '../src/studio-handoff'

const json = JSON.stringify({ schemaVersion: 1, paths: ['colors.brand'], big: 'x'.repeat(200_000) })

describe('studio handoff', () => {
  it('round-trips a spec', async () => {
    const { sealed, key } = await sealSpec(json)
    expect(await openSpec(sealed, key)).toBe(json)
  })

  it('compresses and encodes as base64url', async () => {
    const { sealed, key } = await sealSpec(json)
    expect(sealed.data.length).toBeLessThan(json.length / 10)
    for (const value of [sealed.iv, sealed.data, key]) expect(value).toMatch(/^[\w-]+$/)
  })

  it('never puts the plaintext in the sealed payload', async () => {
    const { sealed } = await sealSpec(json)
    expect(JSON.stringify(sealed)).not.toContain('colors.brand')
  })

  it('rejects a different key', async () => {
    const { sealed } = await sealSpec(json)
    const { key: other } = await sealSpec(json)
    await expect(openSpec(sealed, other)).rejects.toThrow()
  })

  it('rejects tampered data', async () => {
    const { sealed, key } = await sealSpec(json)
    const flipped = sealed.data[5] === 'A' ? 'B' : 'A'
    await expect(
      openSpec({ ...sealed, data: sealed.data.slice(0, 5) + flipped + sealed.data.slice(6) }, key),
    ).rejects.toThrow()
  })
})
