import { Stylesheet, GeneratorContext, CSSCondition } from '@css-panda/atomic'
import { CSSUtility, mergeUtilities } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { UserConfig } from '@css-panda/types'
import { walkObject } from '@css-panda/walk-object'
import path from 'path'
import postcss from 'postcss'
import { createDebug } from './debug'

const BASE_IGNORE = ['node_modules', '.git', '__tests__', 'tests']

export function createContext(config: UserConfig) {
  const { breakpoints = {}, conditions = {} } = config

  const dictionary = new Dictionary({
    tokens: config.tokens ?? {},
    semanticTokens: config.semanticTokens ?? {},
    prefix: config.prefix,
  })

  const utilities = new CSSUtility({
    tokens: dictionary,
    config: mergeUtilities(config.utilities),
  })

  const context = (): GeneratorContext => ({
    root: postcss.root(),
    breakpoints,
    conditions,
    _conditions: new CSSCondition({
      conditions,
      breakpoints,
    }),
    transform(prop, value) {
      return utilities.resolve(prop, value)
    },
  })

  const stylesheet = new Stylesheet(context())

  const tempDir = path.join(config.outdir, '.temp')
  createDebug('config:tmpfile', tempDir)

  const flattenedRecipes = Object.fromEntries(
    (config.recipes ?? []).map((recipe) => {
      const base = {}
      walkObject(recipe.base, (value, paths) => {
        const [prop] = paths as string[]
        const { styles } = utilities.resolve(prop, value)
        Object.assign(base, styles)
      })
      createDebug(`recipe:${recipe.name}`, base)
      return [recipe.name, recipe]
    }),
  )

  return {
    ...config,
    ignore: BASE_IGNORE.concat(config.outdir, config.ignore ?? []),
    importMap: {
      css: `${config.outdir}/css`,
      recipe: `${config.outdir}/recipes`,
    },
    recipes: flattenedRecipes,
    cwd: process.cwd(),
    tempDir,
    config,
    dictionary,
    context,
    stylesheet,
    utilities,
  }
}

export type InternalContext = ReturnType<typeof createContext>
