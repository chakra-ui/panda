import type { CssOptions, Stylesheet } from '@pandacss/core'
import type { RecipeDefinition, SlotRecipeDefinition, SystemStyleObject } from '@pandacss/types'
import type { Context } from './context'
import type { StyleDecoder } from './style-decoder'
import type { StyleEncoder } from './style-encoder'

export class RuleProcessor {
  encoder: StyleEncoder
  decoder: StyleDecoder
  sheet: Stylesheet

  constructor(private context: Context) {
    this.encoder = context.encoder
    this.decoder = context.decoder
    this.sheet = context.createSheet()
  }

  getParamsOrThrow() {
    const isReady = Boolean(this.encoder && this.decoder && this.sheet)
    if (!isReady) {
      throw new Error('RuleProcessor is missing params, please call `clone` first')
    }

    return {
      encoder: this.encoder,
      decoder: this.decoder,
      sheet: this.sheet,
    }
  }

  clone() {
    this.encoder = this.context.encoder.clone()
    this.decoder = this.context.decoder.clone()
    this.sheet = this.context.createSheet()

    return this
  }

  toCss(options?: CssOptions) {
    const { decoder, sheet } = this.getParamsOrThrow()

    sheet.processDecoder(decoder)
    return sheet.toCss({ optimize: true, ...options })
  }

  css(styles: SystemStyleObject): AtomicRule {
    const { encoder, decoder } = this.getParamsOrThrow()

    encoder.processAtomic(styles)
    decoder.collect(encoder)

    return {
      styles,
      getClassNames: () => Array.from(decoder.classNames.keys()),
      toCss: this.toCss.bind(this),
    }
  }

  cva(recipeConfig: RecipeDefinition<any>): AtomicRecipeRule {
    const { encoder, decoder } = this.getParamsOrThrow()

    encoder.processAtomicRecipe(recipeConfig)
    decoder.collect(encoder)

    return {
      config: recipeConfig,
      getClassNames: () => Array.from(decoder.classNames.keys()),
      toCss: this.toCss.bind(this),
    }
  }

  sva(recipeConfig: SlotRecipeDefinition<string, any>): AtomicRecipeRule {
    const { encoder, decoder } = this
    this.getParamsOrThrow()

    encoder.processAtomicSlotRecipe(recipeConfig)
    decoder.collect(encoder)
    return {
      config: recipeConfig,
      getClassNames: () => Array.from(decoder.classNames.keys()),
      toCss: this.toCss.bind(this),
    }
  }

  recipe(name: string, variants: Record<string, any> = {}): RecipeRule | undefined {
    const { encoder, decoder } = this
    this.getParamsOrThrow()

    encoder.processRecipe(name, variants)
    decoder.collect(encoder)

    return {
      variants,
      getClassNames: () => Array.from(decoder.classNames.keys()),
      toCss: this.toCss.bind(this),
    }
  }
}

interface BaseRule {
  getClassNames: () => string[]
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
