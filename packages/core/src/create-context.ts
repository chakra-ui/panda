import { CSSCondition, GeneratorContext, Stylesheet } from '@css-panda/atomic'
import { CSSUtility, mergeUtilities } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { UserConfig } from '@css-panda/types'
import { walkObject } from '@css-panda/walk-object'
import path from 'path'
import postcss from 'postcss'
import { createDebug } from './debug'
import merge from 'lodash/merge'

const BASE_IGNORE = ['node_modules', '.git', '__tests__', 'tests']

function forEach(obj: any, fn: Function) {
  const { selectors = {}, '@media': mediaQueries = {}, ...styles } = obj

  fn(styles)

  for (const [scope, scopeStyles] of Object.entries(selectors)) {
    fn(scopeStyles as any, scope)
  }

  for (const [scope, scopeStyles] of Object.entries(mediaQueries)) {
    fn(scopeStyles as any, `@media ${scope}`)
  }
}

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

  function css(obj: any) {
    const __styles: any = {}

    forEach(obj, (styles: any, selector: string) => {
      const result: any = {}

      walkObject(styles, (value, paths) => {
        const [prop] = paths as string[]
        const { styles } = utilities.resolve(prop, value)

        if (selector) {
          result[selector] ||= {}
          merge(result[selector], styles)
        } else {
          merge(result, styles)
        }
      })

      merge(__styles, result)
    })

    return __styles
  }

  const flattenedRecipes = Object.fromEntries(
    (config.recipes ?? []).map((recipe) => {
      const __recipe: any = {
        name: recipe.name,
        base: {},
        variants: {},
        defaultVariants: recipe.defaultVariants ?? {},
      }

      merge(__recipe.base, css(recipe.base))

      for (const variant in recipe.variants) {
        const element = recipe.variants[variant]
        for (const [value, style] of Object.entries(element)) {
          merge(__recipe.variants, { [variant]: { [value]: css(style) } })
        }
      }

      createDebug(`recipe:${recipe.name}`, recipe, __recipe)
      return [recipe.name, __recipe]
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
