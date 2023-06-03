import type { AnyRecipeConfig, Artifact, LoadConfigResult, ParserResultType } from '@pandacss/types'
import type { JsxRecipeNode } from '@pandacss/core'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss } from './artifacts/css/flat-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { getEngine, type Context } from './engines'
import { getMessages } from './messages'
import type { JsxPatternNode } from './engines/pattern'

const defaults = (conf: LoadConfigResult): LoadConfigResult => ({
  ...conf,
  config: {
    cssVarRoot: ':where(:root, :host)',
    jsxFactory: 'styled',
    outExtension: 'mjs',
    ...conf.config,
  },
})

const getImportMap = (outdir: string) => ({
  css: `${outdir}/css`,
  recipe: `${outdir}/recipes`,
  pattern: `${outdir}/patterns`,
  jsx: `${outdir}/jsx`,
})

export const createGenerator = (conf: LoadConfigResult): Generator => {
  const ctx = getEngine(defaults(conf))
  const {
    config: { outdir },
    jsx,
    isValidProperty,
    patterns,
    recipes,
  } = ctx

  return {
    ...ctx,
    getArtifacts: generateArtifacts(ctx),
    getCss: generateFlattenedCss(ctx),
    getParserCss: generateParserCss(ctx),
    messages: getMessages(ctx),
    parserOptions: {
      importMap: getImportMap(outdir),
      jsx: {
        factory: jsx.factoryName,
        isStyleProp: isValidProperty,
        nodes: [...patterns.nodes, ...recipes.nodes],
      },
      getRecipeName: recipes.getFnName,
      getRecipeByName: recipes.getConfig,
    },
  }
}

export type Generator = Context & {
  getArtifacts: () => Artifact[]
  getCss: (options: { files: string[]; resolve?: boolean | undefined }) => string
  getParserCss: (result: ParserResultType) => string | undefined
  messages: ReturnType<typeof getMessages>
  parserOptions: {
    importMap: {
      css: string
      recipe: string
      pattern: string
      jsx: string
    }
    jsx: {
      factory: string
      isStyleProp: (key: string) => boolean
      nodes: (JsxPatternNode | JsxRecipeNode)[]
    }
    getRecipeName: (jsxName: string) => string
    getRecipeByName: (name: string) => AnyRecipeConfig | undefined
  }
}
