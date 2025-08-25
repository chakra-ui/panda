import { resolveToken, type TokenResolverState, defaultTokenResolver } from './token'
import {
  resolveCondition,
  getConditions,
  getBreakpoints,
  type ConditionResolverState,
  defaultConditionResolver,
} from './condition'
import { CONDITION_MAP } from './mappings'

export interface CSSGeneratorConfig {
  tokenResolver?: TokenResolverState
  conditionResolver?: ConditionResolverState
  classPrefix?: string
}

export interface GeneratedCSS {
  css: string
  className?: string
}

/**
 * CSS generator state
 */
export interface CSSGeneratorState {
  tokenResolver: TokenResolverState
  conditionResolver: ConditionResolverState
  classPrefix: string
  classCounter: number
}

/**
 * Create a CSS generator with the given configuration
 */
export function createCSSGenerator(config: CSSGeneratorConfig = {}): CSSGeneratorState {
  return {
    tokenResolver: config.tokenResolver || defaultTokenResolver,
    conditionResolver: config.conditionResolver || defaultConditionResolver,
    classPrefix: config.classPrefix || 'css',
    classCounter: 0,
  }
}

/**
 * Convert a style object to CSS string
 */
export function generateCSS(
  state: CSSGeneratorState,
  styleObject: Record<string, any>,
  options?: { generateClassName?: boolean },
): GeneratedCSS {
  const { generateClassName = false } = options || {}

  if (hasConditions(state, styleObject)) {
    return generateConditionalCSS(state, styleObject, generateClassName)
  }

  return generateSimpleCSS(state, styleObject, generateClassName)
}

/**
 * Generate CSS for simple style objects (no conditions)
 */
function generateSimpleCSS(
  state: CSSGeneratorState,
  styleObject: Record<string, any>,
  generateClassName: boolean,
): GeneratedCSS {
  const cssProperties = generateCSSProperties(state, styleObject)

  if (generateClassName) {
    const className = generateClassName_internal(state)
    const css = `.${className} {\n${cssProperties}\n}`
    return { css, className }
  }

  return { css: cssProperties }
}

/**
 * Generate CSS for style objects with conditions
 */
function generateConditionalCSS(
  state: CSSGeneratorState,
  styleObject: Record<string, any>,
  generateClassName: boolean,
): GeneratedCSS {
  const className = generateClassName ? generateClassName_internal(state) : undefined
  const baseSelector = className ? `.${className}` : ''

  const cssBlocks = processConditionalStyles(state, styleObject, baseSelector)
  const css = cssBlocks.join('\n\n')

  return { css, className }
}

/**
 * Process style object with conditions recursively
 */
function processConditionalStyles(
  state: CSSGeneratorState,
  styleObject: Record<string, any>,
  baseSelector = '',
  mediaContext = '',
): string[] {
  const cssBlocks: string[] = []
  const baseStyles: Record<string, any> = {}
  const conditionalStyles: Record<string, any> = {}

  // Separate base styles from conditional styles
  for (const [key, value] of Object.entries(styleObject)) {
    if (isCondition(state, key)) {
      conditionalStyles[key] = value
    } else {
      baseStyles[key] = value
    }
  }

  // Generate base styles
  if (Object.keys(baseStyles).length > 0) {
    const cssProperties = generateCSSProperties(state, baseStyles)

    if (baseSelector) {
      const css = `${baseSelector} {\n${cssProperties}\n}`
      cssBlocks.push(mediaContext ? `${mediaContext} {\n  ${css.replace(/\n/g, '\n  ')}\n}` : css)
    } else {
      // Apply media context even without base selector
      cssBlocks.push(mediaContext ? `${mediaContext} {\n  ${cssProperties.replace(/\n/g, '\n  ')}\n}` : cssProperties)
    }
  }

  // Process conditional styles
  for (const [condition, styles] of Object.entries(conditionalStyles)) {
    // First try to resolve the condition directly
    let resolved = resolveCondition(state.conditionResolver, condition)

    // If not resolved, check if it's an alias in CONDITION_MAP
    if (!resolved) {
      for (const [baseCondition, alias] of CONDITION_MAP.entries()) {
        if (alias === condition) {
          resolved = resolveCondition(state.conditionResolver, baseCondition)
          break
        }
      }
    }

    if (resolved) {
      if (resolved.type === 'media') {
        // Handle media queries
        const nestedBlocks = processConditionalStyles(state, styles, baseSelector, resolved.value)
        cssBlocks.push(...nestedBlocks)
      } else {
        // Handle selectors
        const selectorSuffix = resolved.value.replace('&', '')
        const newSelector = baseSelector ? `${baseSelector}${selectorSuffix}` : resolved.value
        const nestedBlocks = processConditionalStyles(state, styles, newSelector, mediaContext)
        cssBlocks.push(...nestedBlocks)
      }
    }
  }

  return cssBlocks
}

/**
 * Generate CSS properties from a flat style object
 */
function generateCSSProperties(state: CSSGeneratorState, styleObject: Record<string, any>): string {
  const properties: string[] = []

  for (const [property, value] of Object.entries(styleObject)) {
    if (typeof value === 'object' && value !== null) {
      continue // Skip nested objects (should be handled separately)
    }

    const cssProperty = camelToKebab(property)
    const cssValue = resolveToken(state.tokenResolver, property, value)
    properties.push(`  ${cssProperty}: ${cssValue};`)
  }

  return properties.join('\n')
}

/**
 * Check if a style object has conditions
 */
function hasConditions(state: CSSGeneratorState, styleObject: Record<string, any>): boolean {
  return Object.keys(styleObject).some((key) => isCondition(state, key))
}

/**
 * Check if a key represents a condition
 */
function isCondition(state: CSSGeneratorState, key: string): boolean {
  // Check if it's a breakpoint
  const breakpoints = getBreakpoints(state.conditionResolver)
  if (breakpoints[key as keyof typeof breakpoints]) {
    return true
  }

  // Check if it's a known condition
  const conditions = getConditions(state.conditionResolver)
  if (conditions[key]) {
    return true
  }

  // Check if it's a condition alias (e.g., _hover maps from hover)
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
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

/**
 * Generate a unique class name
 */
function generateClassName_internal(state: CSSGeneratorState): string {
  return `${state.classPrefix}-${++state.classCounter}`
}

/**
 * Generate CSS from multiple style objects (merge functionality)
 */
export function generateMergedCSS(
  state: CSSGeneratorState,
  styleObjects: Array<Record<string, any> | null | undefined>,
): GeneratedCSS {
  const mergedObject = mergeStyleObjects(styleObjects)
  return generateCSS(state, mergedObject)
}

/**
 * Merge multiple style objects with proper precedence
 */
function mergeStyleObjects(styleObjects: Array<Record<string, any> | null | undefined>): Record<string, any> {
  const definedObjects = styleObjects.filter(Boolean) as Record<string, any>[]

  if (definedObjects.length === 0) {
    return {}
  }

  if (definedObjects.length === 1) {
    return definedObjects[0]
  }

  const merged: Record<string, any> = {}

  for (const obj of definedObjects) {
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
 * Parse and merge CSS strings (inspired by the React Spectrum approach)
 */
export function mergeStyleStrings(...styles: Array<string | null | undefined>): string {
  const definedStyles = styles.filter(Boolean) as string[]

  if (definedStyles.length === 0) {
    return ''
  }

  if (definedStyles.length === 1) {
    return definedStyles[0]
  }

  const propertyMap = new Map<string, string>()

  for (const style of definedStyles) {
    const properties = parseStyleString(style)
    for (const [key, value] of properties) {
      propertyMap.set(key, (propertyMap.get(key) || '') + value)
    }
  }

  return Array.from(propertyMap.values()).join(' ')
}

/**
 * Parse a style string into property-value pairs
 * Simplified version of the React Spectrum parser
 */
function parseStyleString(styleString: string): Map<string, string> {
  const properties = new Map<string, string>()
  let i = 0

  while (i < styleString.length) {
    // Skip whitespace
    while (i < styleString.length && styleString[i] === ' ') {
      i++
    }

    if (i >= styleString.length) break

    const start = i

    // Read property (until first space or colon)
    while (i < styleString.length && styleString[i] !== ' ' && styleString[i] !== ':') {
      i++
    }

    const property = styleString.slice(start, i)

    // Skip to value
    while (i < styleString.length && (styleString[i] === ' ' || styleString[i] === ':')) {
      i++
    }

    const valueStart = i

    // Read value (until semicolon or end)
    while (i < styleString.length && styleString[i] !== ';') {
      i++
    }

    const value = styleString.slice(valueStart, i)

    if (property && value) {
      properties.set(property, `${property}: ${value};`)
    }

    // Skip semicolon
    if (i < styleString.length && styleString[i] === ';') {
      i++
    }
  }

  return properties
}

// Export default instance
export const defaultCSSGenerator = createCSSGenerator()
