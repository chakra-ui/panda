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

    expect(css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(:root, :host) {
          --colors-red: rebeccapurple;
          --icon-sizes-sm: 16px;
          --icon-sizes-button: var(--icon-sizes-sm);
        }
        .dark {
          --icon-sizes-button: 20px;
        }
      }
      "
    `)
  })

  it('resolves a token reference to a custom category', () => {
    const compiler = build()
    compiler.parseFileSource(
      'app.tsx',
      lines("import { css } from '@panda/css'", "css({ '--size': '{iconSizes.sm}' })"),
    )

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\--size_\\{iconSizes\\.sm\\} {
          --size: var(--icon-sizes-sm);
        }
      }
      "
    `)
  })

  it('resolves a custom utility bound to a custom category', () => {
    const compiler = build()
    compiler.parseFileSource('app.tsx', lines("import { css } from '@panda/css'", "css({ iconSize: 'sm' })"))

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(css).toMatchInlineSnapshot(`
      "@layer utilities {
        .icon_sm {
          width: var(--icon-sizes-sm);
        }
      }
      "
    `)
  })

  it('resolves token() at runtime', async () => {
    const { token } = await loadGeneratedModule<TokenRuntime>(build(), { entry: 'tokens/index.mjs' })

    expect({ value: token('iconSizes.sm'), var: token.var('iconSizes.sm') }).toMatchInlineSnapshot(`
      {
        "value": "16px",
        "var": "var(--icon-sizes-sm)",
      }
    `)
  })

  it('includes the category in the generated Token type', () => {
    const types = generatedFile(build(), 'types/tokens.d.ts')

    expect(types).toMatchInlineSnapshot(`
      "export type ColorToken = "colorPalette" | "red"

      export type IconSizeToken = "button" | "sm"

      export interface Tokens {
        colors: ColorToken
        iconSizes: IconSizeToken
      }

      export type Token = \`colors.\${ColorToken}\` | \`iconSizes.\${IconSizeToken}\`

      export type ColorOpacityModifier = \`\${number}\`

      export type ColorOpacityToken = \`colors.\${ColorToken}/\${ColorOpacityModifier}\`

      export type TokenPath = Token | ColorOpacityToken

      export type ColorPalette = "red"

      export type TokenValue<T extends string> = T extends keyof Tokens ? Tokens[T] : never"
    `)
  })
})
