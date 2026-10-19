import { describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createTransformProject } from './test-utils'

interface TokenFunction {
  (path: string, fallback?: string): string
  var(path: string, fallback?: string): string
}

interface TokenRuntime {
  token: TokenFunction
}

type ProjectConfig = Parameters<typeof createTransformProject>[0]

const theme = {
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
      '🔥': { value: '#ff4500' },
    },
  },
  semanticTokens: {
    spacing: {
      'small.gap': {
        value: { base: '{spacing.1.5}', _dark: '{spacing.4}' },
      },
    },
  },
}

async function generate(config: ProjectConfig = {}) {
  const compiler = createTransformProject({ outExtension: 'mjs', theme, ...config })
  const { token } = await loadGeneratedModule<TokenRuntime>(compiler, { entry: 'tokens/index.mjs' })
  const css = compiler.compile({ emitLayerDeclaration: false }).css
  return { compiler, token, css }
}

function declaredName(reference: string) {
  return reference.slice('var('.length, -1)
}

describe('token.var()', () => {
  it('returns the variable the CSS declares for a key containing a dot', async () => {
    const { token, css } = await generate()

    expect(token.var('spacing.1.5')).toMatchInlineSnapshot(`"var(--spacing-1\\.5)"`)
    expect(token.var('colors.brand.primary')).toMatchInlineSnapshot(`"var(--colors-brand\\.primary)"`)
    expect(css).toContain(`${declaredName(token.var('spacing.1.5'))}:`)
    expect(css).toContain(`${declaredName(token.var('colors.brand.primary'))}:`)
  })

  it('keeps a key containing a dot apart from nested keys', async () => {
    const { token, css } = await generate()

    expect(token.var('spacing.nested.1.5')).toMatchInlineSnapshot(`"var(--spacing-nested-1\\.5)"`)
    expect(css).toContain(`${declaredName(token.var('spacing.nested.1.5'))}:`)
  })

  it('returns the variable the CSS declares with a cssVar prefix', async () => {
    const { token, css } = await generate({ prefix: { cssVar: 'panda' } })

    expect(token.var('spacing.1.5')).toMatchInlineSnapshot(`"var(--panda-spacing-1\\.5)"`)
    expect(css).toContain(`${declaredName(token.var('spacing.1.5'))}:`)
  })

  it('returns the variable the CSS declares with hashed variables', async () => {
    const { token, css } = await generate({ hash: { cssVar: true } })

    expect(token.var('spacing.1.5')).toMatchInlineSnapshot(`"var(--jJIQbV)"`)
    expect(token.var('spacing.nested.1.5')).not.toBe(token.var('spacing.1.5'))
    expect(css).toContain(`${declaredName(token.var('spacing.1.5'))}:`)
    expect(css).toContain(`${declaredName(token.var('spacing.nested.1.5'))}:`)
  })

  it('returns the variable the CSS declares with a prefix and hashed variables', async () => {
    const { token, css } = await generate({ prefix: { cssVar: 'panda' }, hash: { cssVar: true } })

    expect(token.var('spacing.1.5')).toMatchInlineSnapshot(`"var(--panda-jJIQbV)"`)
    expect(css).toContain(`${declaredName(token.var('spacing.1.5'))}:`)
  })

  it('leaves emoji in a token key unescaped, like v1', async () => {
    const { token, css } = await generate()

    expect(token.var('colors.🔥')).toMatchInlineSnapshot(`"var(--colors-🔥)"`)
    expect(css).toContain(`${declaredName(token.var('colors.🔥'))}:`)
  })

  it('returns the positive variable for negative spacing, like v1', async () => {
    const { token } = await generate()

    expect(token.var('spacing.-1.5')).toMatchInlineSnapshot(`"var(--spacing-1\\.5)"`)
    expect(token.var('spacing.-4')).toMatchInlineSnapshot(`"var(--spacing-4)"`)
  })

  it('returns the active variable for a conditional token', async () => {
    const { token } = await generate()

    expect(token.var('spacing.small.gap')).toMatchInlineSnapshot(`"var(--spacing-small\\.gap)"`)
  })

  it('uses the fallback only when the token is missing', async () => {
    const { token } = await generate()

    expect(token.var('spacing.1.5', 'ignored')).toBe(token.var('spacing.1.5'))
    expect(token.var('spacing.missing', 'fallback')).toBe('fallback')
    expect(token.var('spacing.missing')).toBeUndefined()
  })
})

describe('token()', () => {
  it('returns the negated value for negative spacing', async () => {
    const { token } = await generate()

    expect(token('spacing.1.5')).toMatchInlineSnapshot(`"0.375rem"`)
    expect(token('spacing.-1.5')).toMatchInlineSnapshot(`"calc(var(--spacing-1\\.5) * -1)"`)
  })

  it('returns the active variable for a conditional token', async () => {
    const { token } = await generate()

    expect(token('spacing.small.gap')).toBe(token.var('spacing.small.gap'))
  })

  it('mixes the variable of a color key containing a dot for an opacity modifier', async () => {
    const { token } = await generate()

    expect(token('colors.brand.primary/50')).toMatchInlineSnapshot(
      `"color-mix(in oklab, var(--colors-brand\\.primary) 50%, transparent)"`,
    )
  })
})

describe('compiled token.var() calls', () => {
  it('inline the same reference as the runtime for a key containing a dot', async () => {
    const { compiler, token } = await generate()
    const source = ["import { token } from '@panda/tokens'", "export const value = token.var('spacing.1.5')"].join('\n')

    const { code } = compiler.transformSource({ path: '/virtual/token.ts', source })

    expect(code).toContain(JSON.stringify(token.var('spacing.1.5')))
  })

  it('inline the positive variable for negative spacing, like the runtime', async () => {
    const { compiler, token } = await generate()
    const source = ["import { token } from '@panda/tokens'", "export const value = token.var('spacing.-4')"].join('\n')

    const { code } = compiler.transformSource({ path: '/virtual/token.ts', source })

    expect(code).toContain(JSON.stringify(token.var('spacing.-4')))
  })

  it('inline the same reference as the runtime with hashed variables', async () => {
    const { compiler, token } = await generate({ hash: { cssVar: true } })
    const source = ["import { token } from '@panda/tokens'", "export const value = token.var('spacing.1.5')"].join('\n')

    const { code } = compiler.transformSource({ path: '/virtual/token.ts', source })

    expect(code).toContain(JSON.stringify(token.var('spacing.1.5')))
  })
})
