import { isPandaConfig } from '../src/is-panda-config'

describe('is-panda-config', () => {
  test('should work as expected', () => {
    expect(isPandaConfig('panda.config.ts')).toBe(true)
    expect(isPandaConfig('testing-panda.config.ts')).toBe(false)
    expect(isPandaConfig('panda-config.ts')).toBe(false)
  })
})
