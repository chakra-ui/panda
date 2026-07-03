import { describe, expect, it } from 'vitest'
import { createCompiler } from '@pandacss/compiler'
import { SpecIndex } from '@pandacss/compiler/tooling'
import { getCompletions, getHover, resolveModule, type LanguageServiceContext } from '../src/service/language-service'

// The design system a user's panda.config.ts resolves to, for these scenarios:
// colors.red.500/blue.500, a `color` utility, and an `_hover` condition.
function createContext(): LanguageServiceContext {
  const compiler = createCompiler({
    cwd: '/virtual',
    outdir: 'styled-system',
    theme: {
      tokens: {
        colors: { red: { 500: { value: '#f00' } }, blue: { 500: { value: '#00f' } } },
      },
    },
    utilities: {
      color: { className: 'c', values: 'colors' },
    },
    conditions: { hover: '&:hover' },
  })
  return {
    specIndex: new SpecIndex(compiler.spec()),
    importMap: compiler.spec().importMap ?? {
      css: ['styled-system/css'],
      recipe: [],
      pattern: [],
      jsx: [],
      tokens: [],
    },
    outdir: 'styled-system',
  }
}

describe('a user typing inside panda.config.ts', () => {
  it('sees matching token paths while typing a semantic token reference like {colors.re}', () => {
    const context = createContext()
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: { colors: { danger: { value: '{colors.re}' } } } },
      })
    `
    const position = source.indexOf('colors.re') + 'colors.re'.length

    const entries = getCompletions({ fileName: 'panda.config.ts', source, position }, context)

    expect(entries.map((entry) => entry.name)).toEqual(expect.arrayContaining(['colors.red.500']))
    expect(entries.every((entry) => entry.kind === 'token')).toBe(true)
  })

  it('sees matching color values while typing inside a global style rule', () => {
    const context = createContext()
    const source = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: 're' } }),
      })
    `
    const position = source.indexOf("'re'") + 3

    const entries = getCompletions({ fileName: 'panda.config.ts', source, position }, context)

    expect(entries).toEqual(expect.arrayContaining([{ name: 'red.500', kind: 'token' }]))
  })

  it("sees utility and condition names while starting a new line inside a recipe's base styles", () => {
    const context = createContext()
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: {  } }) },
      })
    `
    const position = source.indexOf('{  }') + 1

    const entries = getCompletions({ fileName: 'panda.config.ts', source, position }, context)

    expect(entries.map((entry) => entry.name)).toEqual(expect.arrayContaining(['color', '_hover']))
  })

  it("gets no suggestions if they haven't wrapped their styles in defineGlobalStyles yet", () => {
    const context = createContext()
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ globalCss: { html: { color: 're' } } })
    `
    const position = source.indexOf("'re'") + 3

    expect(getCompletions({ fileName: 'panda.config.ts', source, position }, context)).toEqual([])
  })

  it('gets no suggestions while editing an unrelated part of the config, like utilities', () => {
    const context = createContext()
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ utilities: {} })
    `
    const position = source.indexOf('utilities')

    expect(getCompletions({ fileName: 'panda.config.ts', source, position }, context)).toEqual([])
  })
})

describe('a user hovering over their config', () => {
  it('sees the resolved color when hovering a token reference', () => {
    const context = createContext()
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: { colors: { danger: { value: '{colors.red.500}' } } } },
      })
    `
    const position = source.indexOf('colors.red.500') + 3

    const hover = getHover({ fileName: 'panda.config.ts', source, position }, context)

    expect(hover?.text).toBe('colors.red.500\n#f00')
  })

  it('sees nothing when hovering somewhere that has no token reference', () => {
    const context = createContext()
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ globalCss: {} })
    `
    expect(getHover({ fileName: 'panda.config.ts', source, position: 5 }, context)).toBeNull()
  })
})

describe("a user's styled-system import resolving in their editor", () => {
  it('resolves import { css } from "styled-system/css" to the real generated file', () => {
    const context = createContext()
    expect(resolveModule('styled-system/css', context)).toBe('./styled-system/css')
  })

  it('leaves an unrelated import like "react" alone', () => {
    const context = createContext()
    expect(resolveModule('react', context)).toBeUndefined()
  })
})
