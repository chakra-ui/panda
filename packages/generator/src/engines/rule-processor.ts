import type { RecipeDefinition, SlotRecipeDefinition, StyleCollectorType, SystemStyleObject } from '@pandacss/types'
import type { CollectorContext, HashFactory } from './hash-factory'
import type { StyleCollector } from './style-collector'
import type { Stylesheet, ToCssOptions } from '@pandacss/core'

export class RuleProcessor {
  hashFactory: HashFactory | undefined
  styleCollector: StyleCollector | undefined
  sheet: Stylesheet | undefined

  constructor(private context: CollectorContext, private params: Pick<RuleProcessorPrepareParams, 'hash' | 'styles'>) {}

  isReady() {
    return Boolean(this.hashFactory && this.styleCollector && this.sheet)
  }

  prepare(options?: RuleProcessorPrepareParams) {
    if (!this.isReady() || options?.fork) {
      this.sheet = options?.sheet ?? this.context.createSheet()
      this.hashFactory = options?.hash ?? this.params.hash.fork()
      this.styleCollector = options?.styles ?? this.params.styles.fork()
    }

    return {
      hash: this.hashFactory!,
      styles: this.styleCollector!,
      sheet: this.sheet!,
      toCss: (options?: ToCssOptions) => {
        this.sheet!.processStyleCollector(this.styleCollector as StyleCollectorType)
        return this.sheet!.toCss({ optimize: true, ...options })
      },
    }
  }

  toCss(options?: ToCssOptions) {
    const { styles, sheet } = this.prepare()
    sheet.processStyleCollector(styles as StyleCollectorType)
    return sheet.toCss({ optimize: true, ...options })
  }

  css(styleObject: SystemStyleObject): AtomicRule {
    const { hash, styles, sheet } = this.prepare()

    hash.processAtomic(styleObject)
    styles.collect(hash)

    return {
      styleObject,
      className: Array.from(styles.classNames.keys()),
      toCss: (options?: ToCssOptions) => {
        sheet.processStyleCollector(styles as StyleCollectorType)
        return sheet.toCss({ optimize: true, ...options })
      },
    }
  }

  cva(recipeConfig: RecipeDefinition<any> | SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    const { hash, styles, sheet } = this.prepare()

    if ('slots' in recipeConfig) {
      hash.processAtomicSlotRecipe(recipeConfig)
    } else {
      hash.processAtomicRecipe(recipeConfig)
    }

    styles.collect(hash)

    return {
      config: recipeConfig,
      className: Array.from(styles.classNames.keys()),
      toCss: (options?: ToCssOptions) => {
        sheet.processStyleCollector(styles as StyleCollectorType)
        return sheet.toCss({ optimize: true, ...options })
      },
    }
  }

  sva(recipeConfig: SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    return this.cva(recipeConfig)
  }

  recipe(name: string, variants: Record<string, any>): RecipeRule | undefined {
    const recipeConfig = this.context.recipes.getConfig(name)
    if (!recipeConfig) return

    const { hash, styles, sheet } = this.prepare()

    hash.processRecipe(name, variants)
    styles.collect(hash)

    return {
      variants,
      className: Array.from(styles.classNames.keys()),
      toCss: (options?: ToCssOptions) => {
        sheet.processStyleCollector(styles as StyleCollectorType)
        return sheet.toCss({ optimize: true, ...options })
      },
    }
  }
}

interface BaseRule {
  className: string[]
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

interface RuleProcessorPrepareParams {
  fork?: boolean
  hash: HashFactory
  styles: StyleCollector
  sheet?: Stylesheet
}
