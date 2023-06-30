import type { ConfigResultWithHooks, TSConfig } from '@pandacss/types'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss } from './artifacts/css/flat-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { getEngine } from './engines'
import { getMessages } from './messages'

const defaults = (conf: ConfigResultWithHooks): ConfigResultWithHooks => ({
  ...conf,
  config: {
    cssVarRoot: ':where(:root, :host)',
    jsxFactory: 'styled',
    outExtension: 'mjs',
    shorthands: true,
    syntax: 'object-literal',
    ...conf.config,
  },
})

const getImportMap = (outdir: string) => ({
  css: `${outdir}/css`,
  recipe: `${outdir}/recipes`,
  pattern: `${outdir}/patterns`,
  jsx: `${outdir}/jsx`,
})

export const createGenerator = (conf: ConfigResultWithHooks) => {
  const ctx = getEngine(defaults(conf))
  const { config, jsx, isValidProperty, patterns, recipes } = ctx

  const compilerOptions = (conf.tsconfig as TSConfig)?.compilerOptions ?? {}
  const baseUrl = compilerOptions.baseUrl ?? ''

  const cwd = conf.config.cwd
  const relativeBaseUrl = baseUrl ? baseUrl.replace(cwd, '').slice(1) + '/' : cwd

  return {
    ...ctx,
    getArtifacts: generateArtifacts(ctx),
    getCss: generateFlattenedCss(ctx),
    getParserCss: generateParserCss(ctx),
    messages: getMessages(ctx),
    parserOptions: {
      importMap: getImportMap(config.outdir.replace(relativeBaseUrl, '')),
      jsx: {
        factory: jsx.factoryName,
        isStyleProp: isValidProperty,
        nodes: [...patterns.nodes, ...recipes.nodes],
      },
      getRecipesByJsxName: recipes.filter,
    },
  }
}

export type Generator = ReturnType<typeof createGenerator>
