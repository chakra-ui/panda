import { beforeAll, describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createTransformProject } from './test-utils'

interface TokenFunction {
  (path: string, fallback?: string): string
  var(path: string, fallback?: string): string
}

interface TokenRuntime {
  token: TokenFunction
}

const variableConfigs = [
  { name: 'ordinary variables', prefix: {}, hash: false },
  { name: 'prefixed variables', prefix: { cssVar: 'panda' }, hash: false },
  { name: 'hashed variables', prefix: {}, hash: { cssVar: true } },
  { name: 'prefixed hashed variables', prefix: { cssVar: 'panda' }, hash: { cssVar: true } },
]

const tokenPaths = [
  'spacing.1.5',
  'spacing.nested.1.5',
  'spacing.4',
  'spacing.-1.5',
  'spacing.-4',
  'colors.brand.primary',
  'spacing.small.gap',
]

describe.each(variableConfigs)('generated token runtime: $name', ({ prefix, hash }) => {
  let compiler: ReturnType<typeof createTransformProject>
  let token: TokenFunction
  let css: string

  beforeAll(async () => {
    compiler = createTransformProject({
      outExtension: 'mjs',
      prefix,
      hash,
      theme: {
        tokens: {
          spacing: {
            '1.5': { value: '0.375rem' },
            nested: {
              '1.5': { value: '0.5rem' },
            },
            '4': { value: '1rem' },
          },
          colors: {
            'brand.primary': { value: '#ff0000' },
          },
        },
        semanticTokens: {
          spacing: {
            'small.gap': {
              value: { base: '{spacing.1.5}', _dark: '{spacing.4}' },
            },
          },
        },
      },
    })
    const runtime = await loadGeneratedModule<TokenRuntime>(compiler, { entry: 'tokens/index.mjs' })
    token = runtime.token
    css = compiler.compile({ emitLayerDeclaration: false }).css
  })

  it('returns variables declared in the emitted CSS', () => {
    for (const path of tokenPaths) {
      const reference = token.var(path)
      const variableName = reference.slice('var('.length, -1)
      expect(css).toContain(`${variableName}:`)
    }

    if (hash === false) {
      const namePrefix = prefix.cssVar ? `${prefix.cssVar}-` : ''
      expect(token.var('spacing.1.5')).toBe(String.raw`var(--${namePrefix}spacing-1\.5)`)
    }
  })

  it('inlines the same references as the generated runtime', () => {
    for (const path of tokenPaths) {
      const source = ["import { token } from '@panda/tokens'", `export const value = token.var('${path}')`].join('\n')
      const transformed = compiler.transformSource({ path: '/virtual/token.ts', source })
      const expectedLiteral = JSON.stringify(token.var(path))
      expect(transformed.code).toContain(expectedLiteral)
    }
  })

  it('keeps negative values separate from variable references, matching v1', () => {
    for (const name of ['1.5', '4']) {
      const positiveReference = token.var(`spacing.${name}`)
      expect(token.var(`spacing.-${name}`)).toBe(positiveReference)
      expect(token(`spacing.-${name}`)).toBe(`calc(${positiveReference} * -1)`)
    }
    expect(token('spacing.1.5')).toBe('0.375rem')
  })

  it('returns the active variable for conditional tokens', () => {
    expect(token('spacing.small.gap')).toBe(token.var('spacing.small.gap'))
  })

  it('uses the dotted color key reference in opacity modifiers', () => {
    const colorReference = token.var('colors.brand.primary')
    const expectedMix = `color-mix(in oklab, ${colorReference} 50%, transparent)`
    expect(token('colors.brand.primary/50')).toBe(expectedMix)
  })

  it('uses the fallback only when the token is missing', () => {
    for (const path of tokenPaths) {
      expect(token.var(path, 'ignored')).toBe(token.var(path))
    }
    expect(token.var('spacing.missing', 'fallback')).toBe('fallback')
    expect(token.var('spacing.missing')).toBeUndefined()
  })
})
