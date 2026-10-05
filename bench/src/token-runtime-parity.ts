import assert from 'node:assert/strict'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { preset } from '@pandacss/preset-panda'
import { createCompiler, type SerializedConfig, type NativeSourceTransformer } from '@pandacss/compiler'
import { loadGeneratedModule } from '../../packages/compiler/__tests__/generated-runtime'

interface TokenRuntime {
  token: ((path: string, fallback?: string) => string) & {
    var: (path: string, fallback?: string) => string
  }
}

type LegacyTheme = Pick<ConstructorParameters<typeof TokenDictionary>[0], 'tokens' | 'semanticTokens'>

const fixtures: Array<{ name: string; theme: LegacyTheme }> = [
  { name: 'v1 preset', theme: preset.theme },
  {
    name: 'dotted keys',
    theme: {
      tokens: {
        spacing: { '1.5': { value: '0.375rem' }, '4': { value: '1rem' } },
        colors: { 'brand.primary': { value: '#ff0000' } },
      },
      semanticTokens: {
        spacing: { 'small.gap': { value: { base: '{spacing.1.5}', _dark: '{spacing.4}' } } },
      },
    },
  },
  { name: 'nested numeric keys', theme: { tokens: { sizes: { '1': { '5': { value: '0.5rem' } } } } } },
  { name: 'dotted numeric key', theme: { tokens: { sizes: { '1.5': { value: '0.5rem' } } } } },
  { name: 'nested word keys', theme: { tokens: { colors: { brand: { primary: { value: '#ff0000' } } } } } },
]

let comparisons = 0
for (const prefix of ['', 'panda']) {
  for (const hash of [false, true]) {
    for (const { name, theme } of fixtures) {
      const legacy = new TokenDictionary({
        tokens: theme.tokens,
        semanticTokens: theme.semanticTokens,
        prefix,
        hash,
        colorPalette: { enabled: name === 'v1 preset' },
      }).init()
      const compiler = createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        outExtension: 'mjs',
        importMap: { tokens: ['@panda/tokens'] },
        theme: theme as SerializedConfig['theme'],
        prefix: { cssVar: prefix },
        hash: { cssVar: hash },
      }) as ReturnType<typeof createCompiler> & NativeSourceTransformer
      const { token } = await loadGeneratedModule<TokenRuntime>(compiler, { entry: 'tokens/index.mjs' })
      // This is the variable projection used by the published v1 generator.
      const variables = new Map(legacy.allTokens.map((token) => [token.name, token.extensions.varRef as string]))
      for (const [path, expected] of variables) {
        const label = `${name}: ${path}, prefix=${prefix}, hash=${hash}`
        assert.equal(token.var(path), expected, label)
        assert.equal(token.var(path, 'ignored'), expected, label)
        const source = `import { token } from '@panda/tokens'; export const value = token.var(${JSON.stringify(path)})`
        assert.ok(
          compiler.transformSource({ path: '/virtual/token.ts', source }).code.includes(JSON.stringify(expected)),
          label,
        )
        comparisons++
      }
      assert.equal(token.var('spacing.missing', 'fallback'), 'fallback')
      assert.equal(token.var('spacing.missing'), undefined)
    }
  }
}
console.log(`Passed ${comparisons} v1 token variable comparisons, including compiler folding.`)
