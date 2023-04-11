import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss } from './artifacts/css/flat-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { getEngine } from './engines'
import { getMessages } from './messages'

const defaults = (conf: LoadConfigResult): LoadConfigResult => ({
  ...conf,
  config: {
    cssVarRoot: ':where(:root, :host)',
    jsxFactory: 'panda',
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

export const createGenerator = (conf: LoadConfigResult) =>
  pipe(
    getEngine(defaults(conf)),
    Obj.assign((ctx) => ({
      getArtifacts: generateArtifacts(ctx),
      getCss: generateFlattenedCss(ctx),
      getParserCss: generateParserCss(ctx),
      messages: getMessages(ctx),
    })),
    Obj.bind('parserOptions', ({ config: { outdir }, jsx, isValidProperty, patterns, recipes }) => ({
      importMap: getImportMap(outdir),
      jsx: {
        factory: jsx.factoryName,
        isStyleProp: isValidProperty,
        nodes: [...patterns.nodes, ...recipes.nodes],
      },
      getRecipeName: recipes.getFnName,
      getRecipeByName: recipes.getConfig,
    })),
  )

export type Generator = ReturnType<typeof createGenerator>
