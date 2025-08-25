export { reverseSplitter } from './reverse-splitter'

// Minimal utility-to-CSS conversion system
export {
  createTokenResolver,
  resolveToken,
  generateCSSVariables,
  addTokens,
  getTokensForProperty,
  defaultTokenResolver,
  type TokenCategories,
  type TokenConfig,
  type TokenResolverState,
} from './token'

export {
  createConditionResolver,
  resolveCondition,
  addCondition,
  addBreakpoint,
  getConditions,
  getBreakpoints,
  defaultConditionResolver,
  type BreakpointConfig,
  type ConditionConfig,
  type ResolvedCondition,
  type ConditionResolverState,
} from './condition'

export {
  createCSSGenerator,
  generateCSS,
  generateMergedCSS,
  mergeStyleStrings,
  defaultCSSGenerator,
  type CSSGeneratorConfig,
  type GeneratedCSS,
  type CSSGeneratorState,
} from './generator'

export {
  createConverter,
  convert,
  convertAndMerge,
  serialize,
  convertAndMergeUtilities,
  generateTokenCSS,
  addCustomTokens,
  addCustomCondition,
  addCustomBreakpoint,
  getAvailableTokensForProperty,
  getAvailableConditions,
  getAvailableBreakpoints,
  defaultConverter,
  type ConversionConfig,
  type SerializeResult as ConversionResult,
  type AtomicSerializeResult,
} from './serialize'

export {
  CLASS_TO_PROPERTY_MAP,
  SHORTHAND_ALIASES,
  CONDITION_MAP,
  DEFAULT_BREAKPOINTS,
  DEFAULT_CONDITIONS,
  PROPERTY_TO_TOKEN_CATEGORY,
  DEFAULT_TOKENS,
} from './mappings'
