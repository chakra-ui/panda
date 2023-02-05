import { useMemo } from 'react'
import { createParser, createProject } from '@pandacss/parser'
import { Conditions, Stylesheet, Utility, createRoot } from '@pandacss/core'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { UserConfig } from '@pandacss/types'

const outdir = '.'
const importMap = {
  css: `${outdir}/css`,
  recipe: `${outdir}/recipes`,
  pattern: `${outdir}/patterns`,
  jsx: `${outdir}/jsx`,
}
const parseSourceFile = createParser({
  importMap,
  jsx: {
    factory: 'panda',
    isStyleProp: () => true,
    nodes: [],
  },
})

export function usePanda(source: string, config: UserConfig) {
  return useMemo(() => {
    const project = createProject({
      getFiles: () => ['test.tsx'],
      readFile: (file) => (file === 'test.tsx' ? source : ''),
      parserOptions: {
        importMap,
      },
      useInMemoryFileSystem: true,
    })
    const sourceFile = project.createSourceFile('test.tsx')
    const parseResult = parseSourceFile(sourceFile)

    const breakpoints = {
      sm: '640px',
      md: '768px',
    }
    const tokensProp = config.theme?.tokens
    const semanticTokens = {}
    const prefix = ''
    const separator = ''
    const utilities = config.utilities
    const conditionsProp = config.conditions
    const hash = false

    const tokens = new TokenDictionary({
      tokens: tokensProp,
      breakpoints,
      semanticTokens,
      prefix,
    })
    const utility = new Utility({
      prefix: '',
      tokens: tokens,
      config: utilities,
      separator,
    })

    const conditions = new Conditions({
      conditions: conditionsProp,
      breakpoints,
    })

    const sheet = new Stylesheet({
      root: createRoot(),
      conditions,
      hash,
      helpers: [],
      utility,
    })

    parseResult?.css.forEach((css) => {
      sheet.processAtomic(css.data)
    })

    return sheet.toCss()
  }, [source])
}
