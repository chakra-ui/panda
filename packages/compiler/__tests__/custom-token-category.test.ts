import { describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createTransformProject, lines } from './test-utils'

interface TokenRuntime {
  token: ((path: string) => string) & { var: (path: string) => string }
}

function build() {
  return createTransformProject({
    outExtension: 'mjs',
    conditions: { dark: '.dark &' },
    theme: {
      tokens: {
        colors: { red: { value: 'rebeccapurple' } },
        iconSizes: { sm: { value: '16px' } },
      },
      semanticTokens: {
        iconSizes: { button: { value: { base: '{iconSizes.sm}', _dark: '20px' } } },
      },
    },
    utilities: { iconSize: { className: 'icon', property: 'width', values: 'iconSizes' } },
  })
}

function generatedFile(compiler: ReturnType<typeof build>, path: string) {
  const files = compiler.generateArtifacts().flatMap((artifact) => artifact.files)
  return files.find((file) => file.path === path)?.code ?? ''
}

describe('custom token categories', () => {
  it('emits css variables for a custom category', () => {
    const compiler = build()

    const css = compiler.getLayerCss({ layers: ['tokens'] }).css

    expect(css).toContain('--icon-sizes-sm: 16px')
    expect(css).toContain('--icon-sizes-button: var(--icon-sizes-sm)')
    expect(css).toMatch(/\.dark[^{]*\{\s*--icon-sizes-button: 20px/)
  })

  it('resolves a token reference to a custom category', () => {
    const compiler = build()
    compiler.parseFileSource(
      'app.tsx',
      lines("import { css } from '@panda/css'", "css({ '--size': '{iconSizes.sm}' })"),
    )

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(css).toContain('--size: var(--icon-sizes-sm)')
  })

  it('resolves a custom utility bound to a custom category', () => {
    const compiler = build()
    compiler.parseFileSource('app.tsx', lines("import { css } from '@panda/css'", "css({ iconSize: 'sm' })"))

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(css).toContain('width: var(--icon-sizes-sm)')
  })

  it('resolves token() at runtime', async () => {
    const { token } = await loadGeneratedModule<TokenRuntime>(build(), { entry: 'tokens/index.mjs' })

    expect(token('iconSizes.sm')).toBe('16px')
    expect(token.var('iconSizes.sm')).toBe('var(--icon-sizes-sm)')
  })

  it('includes the category in the generated Token type', () => {
    const types = generatedFile(build(), 'types/tokens.d.ts')

    expect(types).toContain('export type IconSizeToken = "button" | "sm"')
    expect(types).toContain('`iconSizes.${IconSizeToken}`')
  })
})
