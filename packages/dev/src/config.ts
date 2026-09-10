import type {
  AnimationStyles,
  CompositionStyles,
  Config,
  CssKeyframes,
  ExtendableConditions,
  GlobalFontface,
  GlobalStyleObject,
  LayerStyles,
  PatternConfig,
  PandaPlugin,
  Preset,
  PropertyConfig,
  RecipeConfig,
  RecipeVariantRecord,
  SemanticTokens,
  SlotRecipeConfig,
  SlotRecipeVariantRecord,
  SystemStyleObject,
  TextStyles,
  ThemeVariant,
  Tokens,
  FirstThatWorksMember,
  ViewTransitions,
  PositionTry,
} from '@pandacss/types'

type FirstThatWorksMemberOf<T> = Extract<T, FirstThatWorksMember>

export function firstThatWorks<
  T = FirstThatWorksMember,
  A extends FirstThatWorksMemberOf<T> = FirstThatWorksMemberOf<T>,
  B extends FirstThatWorksMemberOf<T> = FirstThatWorksMemberOf<T>,
  C extends FirstThatWorksMemberOf<T> = never,
  D extends FirstThatWorksMemberOf<T> = never,
  E extends FirstThatWorksMemberOf<T> = never,
  F extends FirstThatWorksMemberOf<T> = never,
>(
  first: A,
  second: B,
  third?: C,
  fourth?: D,
  fifth?: E,
  sixth?: F,
): T extends FirstThatWorksMember ? A | B | C | D | E | F : FirstThatWorksMemberOf<T>
export function firstThatWorks(...values: unknown[]) {
  return `firstThatWorks(${values.join(', ')})`
}

export function defineConfig<const T extends Config>(config: T): T & { name: string } {
  return Object.assign(config, { name: '__panda.config__' })
}

export function defineRecipe<T extends RecipeVariantRecord>(config: RecipeConfig<T>): RecipeConfig<T> {
  return config
}

export function defineSlotRecipe<S extends string, T extends SlotRecipeVariantRecord<S>>(
  config: SlotRecipeConfig<S, T>,
): SlotRecipeConfig<S, T> {
  return config
}

export function definePattern<T extends PatternConfig>(config: T): PatternConfig {
  return config
}

export function definePreset<const T extends Preset>(preset: T): T {
  return preset
}

export function defineKeyframes(keyframes: CssKeyframes): CssKeyframes {
  return keyframes
}

export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject {
  return definition
}

export function defineGlobalFontface(definition: GlobalFontface): GlobalFontface {
  return definition
}

export function defineUtility(utility: PropertyConfig): PropertyConfig {
  return utility
}

export function defineConditions(definition: ExtendableConditions): ExtendableConditions {
  return definition
}

export function definePlugin(plugin: PandaPlugin): PandaPlugin {
  return plugin
}

export function defineThemeVariant<T extends ThemeVariant>(theme: T): T {
  return theme
}

export function defineThemeContract<C extends Partial<Omit<ThemeVariant, 'selector'>>>(_contract: C) {
  return <T extends C & ThemeVariant>(theme: T): T => defineThemeVariant(theme)
}

function createProxy() {
  const identity = <T>(value: T) => value
  return new Proxy(identity, {
    get() {
      return identity
    },
  })
}

export const defineTokens = createProxy() as {
  <Value>(definition: Value): Value
} & {
  [K in keyof Required<Tokens>]: <Value>(definition: Value) => Value
}

export const defineSemanticTokens = createProxy() as {
  <Value>(definition: Value): Value
} & {
  [K in keyof Required<SemanticTokens>]: <Value>(definition: Value) => Value
}

export function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles {
  return definition
}

export function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles {
  return definition
}

export function defineStyles(definition: SystemStyleObject): SystemStyleObject {
  return definition
}

export function defineAnimationStyles(definition: CompositionStyles['animationStyles']): AnimationStyles {
  return definition
}

export function defineViewTransitions(definition: ViewTransitions): ViewTransitions {
  return definition
}

export function definePositionTry(definition: PositionTry): PositionTry {
  return definition
}
