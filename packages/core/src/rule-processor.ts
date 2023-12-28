import type { RecipeDefinition, SlotRecipeDefinition, StyleCollectorType, SystemStyleObject } from '@pandacss/types'
import type { StyleEncoder } from './style-encoder'
import type { StyleDecoder } from './style-decoder'
import type { Stylesheet, ToCssOptions } from '@pandacss/core'
import type { CoreContext } from './core-context'

export class RuleProcessor {
  encoder: StyleEncoder | undefined
  decoder: StyleDecoder | undefined
  sheet: Stylesheet | undefined

  params: Pick<RuleProcessorPrepareParams, 'hash' | 'styles'>

  constructor(private context: CoreContext, params?: Pick<RuleProcessorPrepareParams, 'hash' | 'styles'>) {
    this.params = params ?? {
      hash: context.encoder,
      styles: context.decoder,
    }
  }

  isReady() {
    return Boolean(this.encoder && this.decoder && this.sheet)
  }

  prepare(options?: RuleProcessorPrepareParams) {
    if (!this.isReady() || options?.clone) {
      this.sheet = options?.sheet ?? this.context.createSheet()
      this.encoder = options?.hash ?? this.params.hash.clone()
      this.decoder = options?.styles ?? this.params.styles.clone()
    }

    return {
      hash: this.encoder!,
      styles: this.decoder!,
      sheet: this.sheet!,
      toCss: (options?: ToCssOptions) => {
        this.sheet!.processStyleCollector(this.decoder as StyleCollectorType)
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
  clone?: boolean
  hash: StyleEncoder
  styles: StyleDecoder
  sheet?: Stylesheet
}
