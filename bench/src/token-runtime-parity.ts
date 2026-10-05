import assert from 'node:assert/strict'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { preset } from '@pandacss/preset-panda'
import type { Tokens, SemanticTokens } from '@pandacss/types'
import { createCompiler, type SerializedConfig, type NativeSourceTransformer } from '@pandacss/compiler'
import { loadGeneratedModule } from '../../packages/compiler/__tests__/generated-runtime'

interface TokenFunction {
  (path: string, fallback?: string): string
  var(path: string, fallback?: string): string
}

interface TokenRuntime {
  token: TokenFunction
}

interface LegacyTheme {
  tokens?: Tokens
  semanticTokens?: SemanticTokens
}

interface Fixture {
  name: string
  theme: LegacyTheme
  colorPalette?: boolean
}

interface VariableOptions {
  prefix: string
  hash: boolean
}

type TransformCompiler = ReturnType<typeof createCompiler> & NativeSourceTransformer

const fixtures: Fixture[] = [
  { name: 'v1 preset', theme: preset.theme, colorPalette: true },
  {
    name: 'dotted keys',
    theme: {
      tokens: {
        spacing: {
          '1.5': { value: '0.375rem' },
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
  },
  {
    name: 'nested numeric keys',
    theme: {
      tokens: {
        sizes: {
          '1': {
            '5': { value: '0.5rem' },
          },
        },
      },
    },
  },
  {
    name: 'dotted numeric key',
    theme: {
      tokens: {
        sizes: {
          '1.5': { value: '0.5rem' },
        },
      },
    },
  },
  {
    name: 'nested word keys',
    theme: {
      tokens: {
        colors: {
          brand: {
            primary: { value: '#ff0000' },
          },
        },
      },
    },
  },
]

const variableOptions: VariableOptions[] = [
  { prefix: '', hash: false },
  { prefix: 'panda', hash: false },
  { prefix: '', hash: true },
  { prefix: 'panda', hash: true },
]

function legacyVariables(fixture: Fixture, options: VariableOptions): Map<string, string> {
  const dictionary = new TokenDictionary({
    tokens: fixture.theme.tokens,
    semanticTokens: fixture.theme.semanticTokens,
    prefix: options.prefix,
    hash: options.hash,
    colorPalette: { enabled: fixture.colorPalette ?? false },
  }).init()

  // Match the published v1 generator's variable projection and last-token precedence.
  const variables = new Map<string, string>()
  for (const token of dictionary.allTokens) {
    variables.set(token.name, token.extensions.varRef)
  }
  return variables
}

function comparisonCompiler(theme: LegacyTheme, options: VariableOptions): TransformCompiler {
  return createCompiler({
    cwd: '/virtual',
    outdir: 'styled-system',
    outExtension: 'mjs',
    importMap: { tokens: ['@panda/tokens'] },
    theme: theme as SerializedConfig['theme'],
    prefix: { cssVar: options.prefix },
    hash: { cssVar: options.hash },
  }) as TransformCompiler
}

async function compareFixture(fixture: Fixture, options: VariableOptions): Promise<number> {
  const variables = legacyVariables(fixture, options)
  const compiler = comparisonCompiler(fixture.theme, options)
  const { token } = await loadGeneratedModule<TokenRuntime>(compiler, { entry: 'tokens/index.mjs' })

  for (const [path, expected] of variables) {
    const label = `${fixture.name}: ${path}, prefix=${options.prefix}, hash=${options.hash}`
    assert.equal(token.var(path), expected, label)
    assert.equal(token.var(path, 'ignored'), expected, label)

    const source = [
      "import { token } from '@panda/tokens'",
      `export const value = token.var(${JSON.stringify(path)})`,
    ].join('\n')
    const transformed = compiler.transformSource({ path: '/virtual/token.ts', source })
    const expectedLiteral = JSON.stringify(expected)
    assert.ok(transformed.code.includes(expectedLiteral), label)
  }

  assert.equal(token.var('spacing.missing', 'fallback'), 'fallback')
  assert.equal(token.var('spacing.missing'), undefined)
  return variables.size
}

let comparisons = 0
for (const options of variableOptions) {
  for (const fixture of fixtures) {
    comparisons += await compareFixture(fixture, options)
  }
}
console.log(`Passed ${comparisons} v1 token variable comparisons, including compiler folding.`)
