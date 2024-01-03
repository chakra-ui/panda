import type { CssOptions, Stylesheet } from '@pandacss/core'
import type { RecipeDefinition, SlotRecipeDefinition, SystemStyleObject } from '@pandacss/types'
import type { CoreContext } from './core-context'
import type { StyleDecoder } from './style-decoder'
import type { StyleEncoder } from './style-encoder'

export class RuleProcessor {
  encoder: StyleEncoder | undefined
  decoder: StyleDecoder | undefined
  sheet: Stylesheet | undefined
  params: Pick<PrepareParams, 'encoder' | 'decoder'>

  constructor(private context: CoreContext, params?: Pick<PrepareParams, 'encoder' | 'decoder'>) {
    this.params = params ?? {
      encoder: context.encoder,
      decoder: context.decoder,
    }
  }

  isReady() {
    return Boolean(this.encoder && this.decoder && this.sheet)
  }

  prepare(options?: PrepareParams) {
    if (!this.isReady() || options?.clone) {
      this.sheet = options?.sheet ?? this.context.createSheet()
      this.encoder = options?.encoder ?? this.params.encoder.clone()
      this.decoder = options?.decoder ?? this.params.decoder.clone()
    }

    return {
      encoder: this.encoder!,
      decoder: this.decoder!,
      sheet: this.sheet!,
      toCss: (options?: CssOptions) => {
        this.sheet!.processDecoder(this.decoder!)
        return this.sheet!.toCss({ optimize: true, ...options })
      },
    }
  }

  toCss(options?: CssOptions) {
    const { decoder, sheet } = this.prepare()
    sheet.processDecoder(decoder)
    return sheet.toCss({ optimize: true, ...options })
  }

  css(styles: SystemStyleObject): AtomicRule {
    const { encoder, decoder, sheet } = this.prepare()

    encoder.processAtomic(styles)
    decoder.collect(encoder)

    return {
      styles,
      className: Array.from(decoder.classNames.keys()),
      toCss: (options?: CssOptions) => {
        sheet.processDecoder(decoder)
        return sheet.toCss({ optimize: true, ...options })
      },
    }
  }

  cva(recipeConfig: RecipeDefinition<any> | SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    const { encoder, decoder, sheet } = this.prepare()

    if ('slots' in recipeConfig) {
      encoder.processAtomicSlotRecipe(recipeConfig)
    } else {
      encoder.processAtomicRecipe(recipeConfig)
    }

    decoder.collect(encoder)

    return {
      config: recipeConfig,
      className: Array.from(decoder.classNames.keys()),
      toCss: (options?: CssOptions) => {
        sheet.processDecoder(decoder)
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

    const { encoder, decoder, sheet } = this.prepare()

    encoder.processRecipe(name, variants)
    decoder.collect(encoder)

    return {
      variants,
      className: Array.from(decoder.classNames.keys()),
      toCss: (options?: CssOptions) => {
        sheet.processDecoder(decoder)
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
  styles: SystemStyleObject
}

interface AtomicRecipeRule extends BaseRule {
  config: RecipeDefinition<any> | SlotRecipeDefinition<string, any>
}

interface RecipeRule extends BaseRule {
  variants: Record<string, any>
}

interface PrepareParams {
  clone?: boolean
  encoder: StyleEncoder
  decoder: StyleDecoder
  sheet?: Stylesheet
}
