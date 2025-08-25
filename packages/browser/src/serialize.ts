import {
  resolveToken,
  generateCSSVariables,
  addTokens,
  getTokensForProperty,
  type TokenResolverState,
  defaultTokenResolver,
} from './token'
import {
  addCondition,
  addBreakpoint,
  getConditions,
  getBreakpoints,
  resolveCondition,
  type ConditionResolverState,
  defaultConditionResolver,
} from './condition'
import { generateCSS, type CSSGeneratorState, defaultCSSGenerator } from './generator'
import { CONDITION_MAP, CLASS_TO_PROPERTY_MAP } from './mappings'

export interface ConversionConfig {
  tokenResolver?: TokenResolverState
  conditionResolver?: ConditionResolverState
  cssGenerator?: CSSGeneratorState
}

export interface SerializeResult {
  css: string
  className?: string
}

export interface AtomicSerializeResult {
  className: string
  css: string
}

/**
 * Conversion state
 */
interface ConversionState {
  tokenResolver: TokenResolverState
  conditionResolver: ConditionResolverState
  cssGenerator: CSSGeneratorState
}

/**
 * Create a utility converter with the given configuration
 */
export function createConverter(config: ConversionConfig = {}): ConversionState {
  return {
    tokenResolver: config.tokenResolver || defaultTokenResolver,
    conditionResolver: config.conditionResolver || defaultConditionResolver,
    cssGenerator: config.cssGenerator || defaultCSSGenerator,
  }
}

/**
 * Convert a utility style object to CSS string
 * Main conversion pipeline: utility => tokens => conditions => CSS
 */
export function convert(
  state: ConversionState,
  styleObject: Record<string, any>,
  options?: { generateClassName?: boolean },
): SerializeResult {
  // Step 1: Resolve tokens in the style object
  const resolvedObject = resolveTokensInObject(state, styleObject)

  // Step 2: Generate CSS with conditions unwrapped
  return generateCSS(state.cssGenerator, resolvedObject, options)
}

/**
 * Convert multiple utility objects and merge them
 */
export function convertAndMerge(
  state: ConversionState,
  styleObjects: Array<Record<string, any> | null | undefined>,
  options?: { generateClassName?: boolean },
): SerializeResult {
  const validObjects = styleObjects.filter(Boolean) as Record<string, any>[]

  if (validObjects.length === 0) {
    return { css: '' }
  }

  if (validObjects.length === 1) {
    return convert(state, validObjects[0], options)
  }

  // Merge objects first, then convert
  const merged = mergeStyleObjects(validObjects)
  return convert(state, merged, options)
}

/**
 * Resolve tokens in a style object recursively
 */
function resolveTokensInObject(state: ConversionState, styleObject: Record<string, any>): Record<string, any> {
  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(styleObject)) {
    // Skip undefined values
    if (value === undefined) {
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively resolve nested objects (conditions)
      resolved[key] = resolveTokensInObject(state, value)
    } else {
      // Resolve token for primitive values
      resolved[key] = resolveToken(state.tokenResolver, key, value)
    }
  }

  return resolved
}

/**
 * Merge multiple style objects with proper precedence
 */
function mergeStyleObjects(styleObjects: Record<string, any>[]): Record<string, any> {
  const merged: Record<string, any> = {}

  for (const obj of styleObjects) {
    deepMerge(merged, obj)
  }

  return merged
}

/**
 * Deep merge two objects
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): void {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (typeof target[key] !== 'object' || target[key] === null || Array.isArray(target[key])) {
        target[key] = {}
      }
      deepMerge(target[key], value)
    } else {
      target[key] = value
    }
  }
}

/**
 * Convert a style object to utility class names like styled-system/css
 */
export function convertToAtomic(state: ConversionState, styleObject: Record<string, any>): AtomicSerializeResult {
  const classNames: string[] = []
  const cssRules: string[] = []

  // Process the style object recursively to generate utility class names
  processUtilityStyles(state, styleObject, classNames, cssRules, [], [])

  return {
    className: classNames.join(' '),
    css: cssRules.join('\n'),
  }
}

/**
 * Process style object and generate utility class names
 */
function processUtilityStyles(
  state: ConversionState,
  styleObject: Record<string, any>,
  classNames: string[],
  cssRules: string[],
  conditionPrefixes: string[],
  originalConditions?: string[],
): void {
  for (const [key, value] of Object.entries(styleObject)) {
    // Skip undefined values
    if (value === undefined) {
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Handle conditions (breakpoints, pseudo-states, etc.)
      const isConditionKey = isCondition(state.cssGenerator, key)
      if (isConditionKey) {
        const conditionPrefix = getConditionPrefix(key)
        if (conditionPrefix) {
          // Pass along accumulated condition prefixes and original conditions
          const newPrefixes = [...conditionPrefixes, conditionPrefix]
          const newOriginals = [...(originalConditions || []), key]
          processUtilityStyles(state, value, classNames, cssRules, newPrefixes, newOriginals)
        }
      }
    } else {
      // Handle primitive values - create utility class name
      const resolvedValue = resolveToken(state.tokenResolver, key, value)

      const utilityClassName = generateUtilityClassName(key, value, conditionPrefixes)
      const cssProperty = camelToKebab(key)

      classNames.push(utilityClassName)

      // Generate CSS rule with proper condition wrapping
      let cssRule: string
      if (conditionPrefixes.length > 0) {
        // Build nested conditions using the condition resolver
        const resolvedConditions = conditionPrefixes.map((prefix) => {
          const resolved = resolveCondition(state.conditionResolver, prefix)
          if (resolved) {
            return resolved
          }
          // Fallback for unknown conditions
          // Check if this is a custom at-rule that should be treated as media
          if (prefix.startsWith('@')) {
            return { type: 'media' as const, value: prefix, priority: 100 }
          }
          return { type: 'selector' as const, value: prefix, priority: 100 }
        })

        // Build nested selectors with proper condition nesting
        let baseSelector = `.${utilityClassName}`
        let mediaQueries = []
        let nestedSelectors = []

        for (let i = 0; i < conditionPrefixes.length; i++) {
          const condition = resolvedConditions[i]
          const originalCondition = originalConditions?.[i]

          if (condition.type === 'media') {
            // Use original condition for media queries if it's available and is an @-rule
            if (originalCondition && originalCondition.startsWith('@')) {
              mediaQueries.push(originalCondition)
            } else {
              mediaQueries.push(condition.value)
            }
          } else {
            // Handle selector conditions - use the full condition value for nesting
            nestedSelectors.push(condition.value)
          }
        }

        let rule: string
        if (nestedSelectors.length > 0) {
          // Resolve selectors by replacing & with the className
          let selector = baseSelector

          for (const conditionValue of nestedSelectors) {
            // Replace & with the current selector to create the final selector
            if (conditionValue.includes('&')) {
              selector = conditionValue.replace(/&/g, selector)
            } else {
              // Fallback for conditions that don't contain &
              selector = selector + ':' + conditionValue
            }
          }

          rule = `${selector} {\n  ${cssProperty}: ${resolvedValue};\n}`
        } else {
          rule = `${baseSelector} {\n  ${cssProperty}: ${resolvedValue};\n}`
        }

        // Wrap in media queries from outermost to innermost
        for (let i = mediaQueries.length - 1; i >= 0; i--) {
          const lines = rule.split('\n')
          const indentedLines = lines.map((line) => (line ? `  ${line}` : line))
          rule = `${mediaQueries[i]} {\n${indentedLines.join('\n')}\n}`
        }
        cssRule = rule
      } else {
        cssRule = `.${utilityClassName} {\n  ${cssProperty}: ${resolvedValue};\n}`
      }

      cssRules.push(cssRule)
    }
  }
}

/**
 * Check if a key is a condition (imported from generator)
 */
function isCondition(cssGenerator: any, key: string): boolean {
  // Check if it's a breakpoint
  const breakpoints = getBreakpoints(cssGenerator.conditionResolver)
  if (breakpoints[key as keyof typeof breakpoints]) {
    return true
  }

  // Check if it's a known condition
  const conditions = getConditions(cssGenerator.conditionResolver)
  if (conditions[key]) {
    return true
  }

  // Check if it's a condition alias
  for (const [baseCondition, alias] of CONDITION_MAP.entries()) {
    if (alias === key && conditions[baseCondition]) {
      return true
    }
  }

  // Check for custom selectors or media queries
  if (key.startsWith('&') || key.startsWith('[') || key.startsWith('@media')) {
    return true
  }

  return false
}

/**
 * Generate utility class name like Panda CSS
 */
function generateUtilityClassName(property: string, value: string | number, conditionPrefixes: string[]): string {
  // Convert property to abbreviated form (like Panda CSS)
  const propertyAbbr = getPropertyAbbreviation(property)

  // Handle arbitrary values in brackets [value] - preserve the brackets in class names
  let valueStr = String(value)
  if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
    // Keep the brackets exactly as they are for class names
    valueStr = valueStr
  } else {
    // Sanitize value for class name but preserve more characters
    valueStr = valueStr.replace(/[^a-zA-Z0-9.\-#()%,:]/g, '_')
  }

  // Create base class name
  let className = `${propertyAbbr}_${valueStr}`

  // Add condition prefixes if present
  if (conditionPrefixes.length > 0) {
    const conditionString = conditionPrefixes.join(':')

    // Check if conditions should be bracketed
    const shouldUseBrackets =
      conditionPrefixes.length > 1 ||
      conditionPrefixes.some((p) => p.startsWith('@') || p.startsWith('&') || p.includes('[') || p.includes('('))

    if (shouldUseBrackets) {
      className = `[${conditionString}]:${className}`
    } else {
      className = `${conditionString}:${className}`
    }
  }

  return className
}

/**
 * Get property abbreviation like Panda CSS using the mappings
 */
function getPropertyAbbreviation(property: string): string {
  // Find the abbreviation by looking for the property value in CLASS_TO_PROPERTY_MAP
  for (const [abbreviation, propertyName] of CLASS_TO_PROPERTY_MAP.entries()) {
    if (propertyName === property) {
      return abbreviation
    }
  }

  // If not found in mappings, convert property to lowercase with hyphens
  return property.replace(/[A-Z]/g, (letter) => letter.toLowerCase())
}

/**
 * Get condition prefix for class names
 */
function getConditionPrefix(condition: string): string {
  // Handle common breakpoints
  if (condition === 'sm') return 'sm'
  if (condition === 'md') return 'md'
  if (condition === 'lg') return 'lg'
  if (condition === 'xl') return 'xl'
  if (condition === '2xl') return '2xl'

  // Handle pseudo-states with underscore prefix
  if (condition.startsWith('_')) {
    const pseudoState = condition.slice(1) // Remove leading underscore
    if (pseudoState === 'hover') return 'hover'
    if (pseudoState === 'focus') return 'focus'
    if (pseudoState === 'active') return 'active'
    if (pseudoState === 'disabled') return 'disabled'
    if (pseudoState === 'checked') return 'checked'
    if (pseudoState === 'invalid') return 'invalid'
    return pseudoState
  }

  // Handle custom at-rules (media queries, supports, etc.)
  if (condition.startsWith('@')) {
    // Encode the at-rule following Panda CSS pattern
    // @media (orientation: landscape) -> @media_(orientation:_landscape)
    const encoded = condition
      .replace(/\s+/g, '_') // spaces to underscores
      .replace(/:/g, ':') // keep colons as-is
      .replace(/\(/g, '(') // keep parentheses as-is
      .replace(/\)/g, ')') // keep parentheses as-is

    return encoded
  }

  // Handle known pseudo-states (without parentheses/complex selectors)
  if (condition.startsWith('&:') && !condition.includes('(') && !condition.includes('[')) {
    if (condition.includes(':hover')) return 'hover'
    if (condition.includes(':focus')) return 'focus'
    if (condition.includes(':active')) return 'active'
    if (condition.includes(':disabled')) return 'disabled'
    if (condition.includes(':checked')) return 'checked'
    // Remove & and : for other simple pseudo-states
    return condition.replace(/^&:/, '')
  }

  // Handle other custom selectors - return as-is, bracketing will be handled by generateUtilityClassName
  if (condition.startsWith('&') || (condition.includes(':') && !condition.startsWith('@'))) {
    return condition
  }

  return condition
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

// Default instance
export const defaultConverter = createConverter()

// Convenience functions using the default converter
export function serialize(styleObject: Record<string, any>): AtomicSerializeResult {
  return convertToAtomic(defaultConverter, styleObject)
}

export function convertAndMergeUtilities(
  styleObjects: Array<Record<string, any> | null | undefined>,
  options?: { generateClassName?: boolean },
): SerializeResult {
  return convertAndMerge(defaultConverter, styleObjects, options)
}

export function generateTokenCSS(): string {
  return generateCSSVariables(defaultConverter.tokenResolver)
}

// Helper functions for working with the default converter
export function addCustomTokens(category: string, tokens: Record<string, string>): void {
  addTokens(defaultConverter.tokenResolver, category as any, tokens)
}

export function addCustomCondition(name: string, value: string): void {
  addCondition(defaultConverter.conditionResolver, name, value)
}

export function addCustomBreakpoint(name: string, value: string): void {
  addBreakpoint(defaultConverter.conditionResolver, name, value)
}

export function getAvailableTokensForProperty(property: string): Record<string, string> | null {
  return getTokensForProperty(defaultConverter.tokenResolver, property)
}

export function getAvailableConditions(): Record<string, string> {
  return getConditions(defaultConverter.conditionResolver)
}

export function getAvailableBreakpoints(): Record<string, string> {
  const breakpoints = getBreakpoints(defaultConverter.conditionResolver)
  // Convert BreakpointConfig to Record<string, string>
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(breakpoints)) {
    if (value) {
      result[key] = value
    }
  }
  return result
}

// Examples of usage:
//
// Basic conversion:
// serialize({ color: 'red', fontSize: 'lg' })
// => { css: "color: var(--panda-colors-red);\nfont-size: var(--panda-fontSizes-lg);" }
//
// With conditions:
// serialize({
//   color: 'blue',
//   sm: { color: 'red' },
//   hover: { color: 'green' }
// })
// => { css: "color: var(--panda-colors-blue);\n@media (min-width: 640px) {\n  color: var(--panda-colors-red);\n}\n&:hover {\n  color: var(--panda-colors-green);\n}" }
//
// With class generation:
// serialize({ color: 'red' }, { generateClassName: true })
// => { css: ".css-1 {\n  color: var(--panda-colors-red);\n}", className: "css-1" }
//
// Merge multiple objects:
// convertAndMergeUtilities([
//   { color: 'blue' },
//   { fontSize: 'lg' },
//   { sm: { color: 'red' } }
// ])
// => merged CSS with proper precedence
