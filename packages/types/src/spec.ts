export type SpecType =
  | 'tokens'
  | 'recipes'
  | 'patterns'
  | 'conditions'
  | 'keyframes'
  | 'semantic-tokens'
  | 'text-styles'
  | 'layer-styles'
  | 'animation-styles'
  | 'color-palette'

interface Examples {
  functionExamples: string[]
  jsxExamples: string[]
}

export interface TokenValue {
  name: string
  value: any
  description?: string
  deprecated?: boolean | string
  cssVar?: string
}

export interface TokenGroupDefinition extends Examples {
  type: string
  values: TokenValue[]
  tokenFunctionExamples: string[]
}

export interface TokenSpec {
  type: 'tokens'
  data: TokenGroupDefinition[]
}

export interface SemanticTokenValue {
  name: string
  values: Array<{ value: string; condition?: string }>
  description?: string
  deprecated?: boolean | string
  cssVar?: string
}

export interface SemanticTokenGroupDefinition extends Examples {
  type: string
  values: SemanticTokenValue[]
  tokenFunctionExamples: string[]
}

export interface SemanticTokenSpec {
  type: 'semantic-tokens'
  data: SemanticTokenGroupDefinition[]
}

export interface RecipeSpecDefinition extends Examples {
  name: string
  description?: string
  variants: Record<string, string[]>
  defaultVariants: Record<string, any>
}

export interface RecipeSpec {
  type: 'recipes'
  data: RecipeSpecDefinition[]
}

export interface PatternSpecProperty {
  name: string
  type: string
  description?: string
  required?: boolean
  defaultValue?: any
}

export interface PatternSpecDefinition extends Examples {
  name: string
  description?: string
  properties: PatternSpecProperty[]
  jsx?: string
}

export interface PatternSpec {
  type: 'patterns'
  data: PatternSpecDefinition[]
}

export interface ConditionSpecDefinition extends Examples {
  name: string
  value: string
}

export interface ConditionSpec {
  type: 'conditions'
  data: ConditionSpecDefinition[]
}

export interface KeyframeSpecDefinition extends Examples {
  name: string
}

export interface KeyframeSpec {
  type: 'keyframes'
  data: KeyframeSpecDefinition[]
}

export interface TextStyleSpecDefinition extends Examples {
  name: string
  description?: string
}

export interface TextStyleSpec {
  type: 'text-styles'
  data: TextStyleSpecDefinition[]
}

export interface LayerStyleSpecDefinition extends Examples {
  name: string
  description?: string
}

export interface LayerStyleSpec {
  type: 'layer-styles'
  data: LayerStyleSpecDefinition[]
}

export interface AnimationStyleSpecDefinition extends Examples {
  name: string
  description?: string
}

export interface AnimationStyleSpec {
  type: 'animation-styles'
  data: AnimationStyleSpecDefinition[]
}

export interface ColorPaletteSpec {
  type: 'color-palette'
  data: {
    values: string[]
    functionExamples: string[]
    jsxExamples: string[]
  }
}

export type SpecFile =
  | TokenSpec
  | SemanticTokenSpec
  | RecipeSpec
  | PatternSpec
  | ConditionSpec
  | KeyframeSpec
  | TextStyleSpec
  | LayerStyleSpec
  | AnimationStyleSpec
  | ColorPaletteSpec

export interface SpecTypeMap {
  tokens: TokenSpec
  'semantic-tokens': SemanticTokenSpec
  recipes: RecipeSpec
  patterns: PatternSpec
  conditions: ConditionSpec
  keyframes: KeyframeSpec
  'text-styles': TextStyleSpec
  'layer-styles': LayerStyleSpec
  'animation-styles': AnimationStyleSpec
  'color-palette': ColorPaletteSpec
}
