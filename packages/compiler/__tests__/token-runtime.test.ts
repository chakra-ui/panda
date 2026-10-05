import { describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createTransformProject } from './test-utils'

interface TokenRuntime {
  token: ((path: string, fallback?: string) => string) & {
    var: (path: string, fallback?: string) => string
  }
}

describe('generated token runtime', () => {
  it.each([
    { prefix: {}, hash: false },
    { prefix: { cssVar: 'panda' }, hash: false },
    { prefix: {}, hash: { cssVar: true } },
    { prefix: { cssVar: 'panda' }, hash: { cssVar: true } },
  ])('matches emitted variables for dotted keys with %j', async ({ prefix, hash }) => {
    const compiler = createTransformProject({
      outExtension: 'mjs',
      prefix,
      hash,
      theme: {
        tokens: {
          spacing: {
            '1.5': { value: '0.375rem' },
            nested: { '1.5': { value: '0.5rem' } },
            '4': { value: '1rem' },
          },
          colors: { 'brand.primary': { value: '#ff0000' } },
        },
        semanticTokens: {
          spacing: { 'small.gap': { value: { base: '{spacing.1.5}', _dark: '{spacing.4}' } } },
        },
      },
    })
    const { token } = await loadGeneratedModule<TokenRuntime>(compiler, { entry: 'tokens/index.mjs' })
    const css = compiler.compile({ emitLayerDeclaration: false }).css

    for (const path of [
      'spacing.1.5',
      'spacing.nested.1.5',
      'spacing.4',
      'spacing.-1.5',
      'spacing.-4',
      'colors.brand.primary',
      'spacing.small.gap',
    ]) {
      const source = `import { token } from '@panda/tokens'; export const value = token.var('${path}')`
      const transformed = compiler.transformSource({ path: '/virtual/token.ts', source })
      expect(transformed.code).toContain(JSON.stringify(token.var(path)))
      expect(css).toContain(`${token.var(path).slice(4, -1)}:`)
      expect(token.var(path, 'ignored')).toBe(token.var(path))
    }
    if (hash === false) {
      const namePrefix = prefix.cssVar ? `${prefix.cssVar}-` : ''
      expect(token.var('spacing.1.5')).toBe(String.raw`var(--${namePrefix}spacing-1\.5)`)
    }
    expect(token('spacing.1.5')).toBe('0.375rem')
    expect(token.var('spacing.-1.5')).toBe(token.var('spacing.1.5'))
    expect(token('spacing.-1.5')).toBe(`calc(${token.var('spacing.1.5')} * -1)`)
    expect(token.var('spacing.-4')).toBe(token.var('spacing.4'))
    expect(token('spacing.-4')).toBe(`calc(${token.var('spacing.4')} * -1)`)
    expect(token('spacing.small.gap')).toBe(token.var('spacing.small.gap'))
    expect(token('colors.brand.primary/50')).toBe(
      `color-mix(in oklab, ${token.var('colors.brand.primary')} 50%, transparent)`,
    )
    expect(token.var('spacing.missing', 'fallback')).toBe('fallback')
  })
})
