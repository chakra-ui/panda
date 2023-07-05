import type { RecipeConfig, Dict, SystemStyleObject } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { AtomicRule } from './atomic-rule'
import { discardDuplicate, expandCssFunctions, optimizeCss } from './optimize'
import { Recipes } from './recipes'
import { safeParse } from './safe-parse'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'
import { logger } from '@pandacss/logger'

export type StylesheetOptions = {
  content?: string
  recipes?: Dict<RecipeConfig>
}

export class Stylesheet {
  private recipes: Recipes

  constructor(private context: StylesheetContext, private options?: StylesheetOptions) {
    const { recipes } = options ?? {}
    this.recipes = new Recipes(recipes ?? {}, context)
  }

  processGlobalCss = (styleObject: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styleObject, { conditions, utility })

    // wrap css root in @layer directive
    const layer = postcss.atRule({
      name: 'layer',
      params: 'base',
      nodes: [css],
    })

    this.context.root.append(layer)
  }

  processSelectorObject(selector: string, styleObject: Dict) {
    const cssString = toCss(styleObject)
    const { nodes } = safeParse(cssString)

    // don't process empty rulesets
    if (nodes.length === 0) return

    const output = postcss.rule({
      selector,
      nodes: cssString.root.nodes,
    })

    this.context.root.append(output)
  }

  processObject(styleObject: SystemStyleObject) {
    const result = toCss(styleObject)
    const output = result.root
    this.context.root.append(output)
  }

  processAtomic = (...styleObject: (SystemStyleObject | undefined)[]) => {
    const ruleset = new AtomicRule(this.context)
    styleObject.forEach((styles) => {
      if (!styles) return
      ruleset.process({ styles })
    })
  }

  processStyleProps = (styleObject: SystemStyleObject & { css?: SystemStyleObject }) => {
    const { css: cssObject, ...restStyles } = styleObject
    this.processAtomic(restStyles, cssObject)
  }

  processRecipe = (config: RecipeConfig, styles: SystemStyleObject) => {
    this.recipes.process(config.name, { styles })
    config.compoundVariants?.forEach((compoundVariant) => {
      this.processAtomic(compoundVariant.css)
    })
  }

  processAtomicRecipe = (recipe: Pick<RecipeConfig, 'base' | 'variants' | 'compoundVariants'>) => {
    const { base = {}, variants = {}, compoundVariants = [] } = recipe
    this.processAtomic(base)
    for (const variant of Object.values(variants)) {
      for (const styles of Object.values(variant)) {
        this.processAtomic(styles)
      }
    }

    compoundVariants.forEach((compoundVariant) => {
      this.processAtomic(compoundVariant.css)
    })
  }

  toCss = ({ optimize = false, minify }: { optimize?: boolean; minify?: boolean } = {}) => {
    try {
      const {
        conditions: { breakpoints },
        utility,
      } = this.context

      breakpoints.expandScreenAtRule(this.context.root)
      expandCssFunctions(this.context.root, { token: utility.getToken })

      let css = this.context.root.toString()

      if (optimize) {
        css = optimizeCss(css, { minify })
      }

      if (this.options?.content) {
        css = `${this.options.content}\n\n${css}`
      }

      return optimize ? discardDuplicate(css) : css
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet', error.message)
        error.plugin && logger.error('sheet', `By plugin: ${error.plugin}:`)

        if (error.source) {
          logger.error('sheet', `Line ${error.line}:${error.column}, in:`)
          logger.error('sheet', error.source)
        }
      }

      throw error
    }
  }

  append = (...css: string[]) => {
    this.context.root.append(...css)
  }

  prepend = (...css: string[]) => {
    this.context.root.prepend(...css)
  }
}
