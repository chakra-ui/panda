import type { RecipeDefinition, SlotRecipeDefinition, SystemStyleObject } from '@pandacss/types'
import type { CollectorContext, HashCollector } from './hash-collector'
import type { StylesCollector } from './styles-collector'

export interface BaseRule {
  className: string
  toCss: () => string
}

export interface AtomicRule extends BaseRule {
  styleObject: SystemStyleObject
}

export interface AtomicRecipeRule extends BaseRule {
  config: RecipeDefinition<any> | SlotRecipeDefinition<string, any>
}

export interface RecipeRule extends BaseRule {
  variants: Record<string, any>
}

export class RuleProcessor {
  constructor(
    private context: CollectorContext,
    private params: { sheet: StyleSheet; hash: HashCollector; styles: StylesCollector },
  ) {}

  css(styleObject: SystemStyleObject): AtomicRule {
    const hash = this.params.hash.fork()
    const styles = this.params.styles.fork()

    hash.processAtomic(styleObject)
    styles.collect(hash)

    return {
      styleObject,
      className: Array.from(styles.classNames).join(' '),
      toCss: () => {
        const sheet = this.context.createSheet()
        sheet.processStylesCollector(styles)
        return sheet.toCss({ optimize: true })
      },
    }
  }

  cva(recipeConfig: RecipeDefinition<any> | SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    const hash = this.params.hash.fork()
    const styles = this.params.styles.fork()

    if ('slots' in recipeConfig) {
      hash.processAtomicSlotRecipe(recipeConfig)
    } else {
      hash.processAtomicRecipe(recipeConfig)
    }

    styles.collect(hash)

    return {
      config: recipeConfig,
      className: Array.from(styles.classNames).join(' '),
      toCss: () => {
        const sheet = this.context.createSheet()
        // console.log(styles)
        sheet.processStylesCollector(styles)
        return sheet.toCss({ optimize: true })
      },
    }
  }

  recipe(name: string, variants: Record<string, any>): RecipeRule | undefined {
    const recipeConfig = this.context.recipes.getConfig(name)
    if (!recipeConfig) return

    const hash = this.params.hash.fork()
    const styles = this.params.styles.fork()

    if ('slots' in recipeConfig) {
      hash.processSlotRecipe(name, variants)
    } else {
      hash.processRecipe(name, variants)
    }

    styles.collect(hash)

    return {
      variants,
      className: Array.from(styles.classNames).join(' '),
      toCss: () => {
        const sheet = this.context.createSheet()
        sheet.processStylesCollector(styles)
        return sheet.toCss({ optimize: true })
      },
    }
  }
}
