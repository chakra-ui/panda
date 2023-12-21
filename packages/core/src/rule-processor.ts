import type { RecipeDefinition, SlotRecipeDefinition, SystemStyleObject } from '@pandacss/types'
import type { Recipes, Stylesheet, ToCssOptions } from '@pandacss/core'

export interface CollectorContext {
  recipes: Recipes
  createSheet: () => Stylesheet
  appendAllCss: () => void
}

export class RuleProcessor {
  sheet: Stylesheet | undefined

  constructor(private context: CollectorContext) {}

  isReady() {
    return Boolean(this.sheet)
  }

  prepare() {
    if (!this.isReady()) {
      this.sheet = this.context.createSheet()
    }

    return {
      sheet: this.sheet!,
    }
  }

  toCss(options?: ToCssOptions) {
    const { sheet } = this.prepare()

    this.context.appendAllCss()

    return sheet.toCss({ optimize: true, ...options })
  }

  css(styleObject: SystemStyleObject): AtomicRule {
    const { sheet } = this.prepare()

    sheet.processAtomic(styleObject)

    return {
      styleObject,
      toCss: (options?: ToCssOptions) => {
        return this.toCss(options)
      },
    }
  }

  cva(recipeConfig: RecipeDefinition<any> | SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    const { sheet } = this.prepare()

    if ('slots' in recipeConfig) {
      sheet.processAtomicSlotRecipe(recipeConfig)
    } else {
      sheet.processAtomicRecipe(recipeConfig)
    }

    return {
      config: recipeConfig,
      toCss: (options?: ToCssOptions) => {
        return this.toCss(options)
      },
    }
  }

  sva(recipeConfig: SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    return this.cva(recipeConfig)
  }

  recipe(name: string, variants: Record<string, any>): RecipeRule | undefined {
    const recipeConfig = this.context.recipes.getConfig(name)
    if (!recipeConfig) return

    const { sheet } = this.prepare()

    sheet.processRecipe(name, recipeConfig, variants)

    return {
      variants,
      toCss: (options?: ToCssOptions) => {
        return this.toCss(options)
      },
    }
  }
}

interface BaseRule {
  toCss: () => string
}

interface AtomicRule extends BaseRule {
  styleObject: SystemStyleObject
}

interface AtomicRecipeRule extends BaseRule {
  config: RecipeDefinition<any> | SlotRecipeDefinition<string, any>
}

interface RecipeRule extends BaseRule {
  variants: Record<string, any>
}
