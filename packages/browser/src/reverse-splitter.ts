import { isCssProperty } from '@pandacss/is-valid-prop'
import { camelCaseProperty } from '@pandacss/shared'
import { CLASS_TO_PROPERTY_MAP, CONDITION_MAP, SHORTHAND_ALIASES } from './mappings'

// Types
interface ParsedClassName {
  property: string
  value: string | number | Record<string, string | number>
  condition?: string
}

// Regex patterns for selector normalization
const HTML_ENTITY_QUOTES_REGEX = /&quot;/g
const CLOSING_BRACKET_UNDERSCORE_REGEX = /\]_/g
const AMPERSAND_UNDERSCORE_REGEX = /([&])_/g
const UNDERSCORE_GLOBAL_REGEX = /_/g

/**
 * Normalizes CSS selector strings by converting underscores to spaces and handling HTML entities
 */
function normalizeSelector(selector: string): string {
  return selector
    .replace(HTML_ENTITY_QUOTES_REGEX, '"') // Handle HTML entity quotes
    .replace(CLOSING_BRACKET_UNDERSCORE_REGEX, '] ') // Add space after closing bracket
    .replace(AMPERSAND_UNDERSCORE_REGEX, '$1 ') // Add space after & character
    .replace(UNDERSCORE_GLOBAL_REGEX, ' ')
}

// Regex patterns for value parsing
const NUMERIC_REGEX = /^-?\d+(\.\d+)?$/
const CSS_UNIT_REGEX =
  /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|lh|rlh|vi|vb|svh|lvh|dvh|svw|lvw|dvw|deg|grad|rad|turn|s|ms|hz|khz|dpi|dpcm|dppx)$/i
const FRACTION_REGEX = /^\d+\/\d+$/

// CSS keywords for value parsing
const CSS_KEYWORDS = new Set(['auto', 'none', 'initial', 'inherit', 'unset', 'transparent', 'currentColor', 'current'])

/**
 * Converts a value string back to its original form
 * Handles underscores, dots, and special cases
 */
function parseValue(value: string): string | number {
  if (!value) return value

  // Handle numeric values (including decimals)
  if (NUMERIC_REGEX.test(value)) {
    const num = parseFloat(value)
    return Number.isInteger(num) ? parseInt(value) : num
  }

  // Handle CSS keywords
  if (CSS_KEYWORDS.has(value)) {
    return value
  }

  // Handle CSS values with units
  if (CSS_UNIT_REGEX.test(value)) {
    return value
  }

  // Handle fractional values like 1/2, 2/3, etc.
  if (FRACTION_REGEX.test(value)) {
    return value
  }

  // Convert underscores back to spaces for multi-word values
  return value.includes('_') ? value.replace(UNDERSCORE_GLOBAL_REGEX, ' ') : value
}

/**
 * Resolves CSS property name from a class prefix
 */
function resolveProperty(prefix: string): string | null {
  // Check explicit mapping first
  const mappedProperty = CLASS_TO_PROPERTY_MAP.get(prefix)
  if (mappedProperty) return mappedProperty

  // Check shorthand aliases
  const aliasedProperty = SHORTHAND_ALIASES.get(prefix)
  if (aliasedProperty) return aliasedProperty

  // Fallback: kebab-case to camelCase conversion for valid CSS properties
  if (prefix.includes('-')) {
    const camelCased = camelCaseProperty(prefix)
    return isCssProperty(camelCased) ? camelCased : null
  }

  return null
}

/**
 * Resolves condition name from condition key
 */
function resolveCondition(conditionKey: string): string {
  const camelCaseKey = camelCaseProperty(conditionKey)
  return CONDITION_MAP.get(conditionKey) || CONDITION_MAP.get(camelCaseKey) || `_${conditionKey}`
}

/**
 * Parses property:value part of a class name
 */
function parsePropertyValue(propertyValue: string): { property: string; value: string | number } | null {
  const parts = propertyValue.split('_')
  if (parts.length < 2) return null

  const prefix = parts[0]
  const value = parts.slice(1).join('_')
  const property = resolveProperty(prefix)

  if (!property) return null

  return { property, value: parseValue(value) }
}

/**
 * Creates a parsed result for a CSS selector pattern
 */
function createSelectorResult(selector: string, propertyValue: string, condition?: string): ParsedClassName | null {
  const parsed = parsePropertyValue(propertyValue)
  if (!parsed) return null

  return {
    property: normalizeSelector(selector),
    value: { [parsed.property]: parsed.value },
    condition,
  }
}

// Regex patterns for parsing class names
const DIRECT_SELECTOR_REGEX = /^\[([^\]]+)\]:(.+)$/
const CONDITION_REGEX = /^([^:]+):(.+)$/
const SELECTOR_MATCH_REGEX = /^\[([^\]]+)\]:(.+)$/

/**
 * Parses direct selector patterns like [&_svg]:w_3 or [&_path]:rtl:trf_rotate(-180deg)
 */
function parseDirectSelectorPattern(className: string): ParsedClassName | null {
  const match = className.match(DIRECT_SELECTOR_REGEX)
  if (!match) return null

  const [, selector, propertyValue] = match

  // Check for nested condition (e.g., "rtl:trf_rotate(-180deg)")
  const conditionMatch = propertyValue.match(CONDITION_REGEX)
  if (conditionMatch) {
    const [, conditionKey, nestedPropertyValue] = conditionMatch
    const condition = resolveCondition(conditionKey)
    return createSelectorResult(selector, nestedPropertyValue, condition)
  }

  // Simple selector pattern without condition
  return createSelectorResult(selector, propertyValue)
}

/**
 * Parses conditional selector patterns like motionReduce:[&_.rfm-marquee]:anim_none!
 */
function parseConditionalSelectorPattern(conditionKey: string, rest: string): ParsedClassName | null {
  const selectorMatch = rest.match(SELECTOR_MATCH_REGEX)
  if (!selectorMatch) return null

  const [, selector, propertyValue] = selectorMatch
  const condition = resolveCondition(conditionKey)
  return createSelectorResult(selector, propertyValue, condition)
}

/**
 * Parses legacy selector pattern format (fallback for backward compatibility)
 */
function parseLegacySelectorPattern(conditionKey: string, rest: string): ParsedClassName | null {
  if (!conditionKey.startsWith('[') || !conditionKey.endsWith(']')) return null

  const selector = conditionKey.slice(1, -1)

  // Check for nested condition
  const nestedConditionMatch = rest.match(CONDITION_REGEX)
  if (nestedConditionMatch) {
    const [, nestedConditionKey, nestedPropertyValue] = nestedConditionMatch
    const condition = resolveCondition(nestedConditionKey)
    return createSelectorResult(selector, nestedPropertyValue, condition)
  }

  // Direct selector pattern
  return createSelectorResult(selector, rest)
}

/**
 * Parses regular conditional classes like sm:fs_2rem
 */
function parseConditionalClass(conditionKey: string, rest: string): ParsedClassName | null {
  const parsed = parsePropertyValue(rest)
  if (!parsed) return null

  const condition = resolveCondition(conditionKey)
  return {
    property: parsed.property,
    value: parsed.value,
    condition,
  }
}

/**
 * Parses a single Panda CSS class name and returns the property-value pair
 */
function parseClassName(className: string): ParsedClassName | null {
  try {
    // 1. Try direct selector patterns first (highest priority)
    const directSelector = parseDirectSelectorPattern(className)
    if (directSelector) return directSelector

    // 2. Parse conditional patterns
    const conditionMatch = className.match(CONDITION_REGEX)
    if (conditionMatch) {
      const [, conditionKey, rest] = conditionMatch

      // 2a. Try conditional selector patterns
      const conditionalSelector = parseConditionalSelectorPattern(conditionKey, rest)
      if (conditionalSelector) return conditionalSelector

      // 2b. Try legacy selector pattern format
      const legacySelector = parseLegacySelectorPattern(conditionKey, rest)
      if (legacySelector) return legacySelector

      // 2c. Regular conditional class
      return parseConditionalClass(conditionKey, rest)
    }

    // 3. Parse basic class names (lowest priority)
    const parsed = parsePropertyValue(className)
    if (!parsed) return null

    return {
      property: parsed.property,
      value: parsed.value,
    }
  } catch (error) {
    console.warn(`Failed to parse class name: ${className}`, error)
    return null
  }
}

/**
 * Checks if a value represents a CSS selector pattern (is an object)
 */
function isSelectorPattern(value: unknown): value is Record<string, string | number> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Ensures a nested object exists and returns it
 */
function ensureNestedObject(parent: Record<string, any>, key: string): Record<string, any> {
  if (!parent[key]) {
    parent[key] = {}
  }
  return parent[key]
}

/**
 * Applies a parsed class name to the style object
 */
function applyParsedClass(styleObject: Record<string, any>, parsed: ParsedClassName): void {
  const { property, value, condition } = parsed

  if (condition) {
    const conditionObject = ensureNestedObject(styleObject, condition)

    if (isSelectorPattern(value)) {
      // CSS selector pattern with condition
      const selectorObject = ensureNestedObject(conditionObject, property)
      Object.assign(selectorObject, value)
    } else {
      // Regular conditional style
      conditionObject[property] = value
    }
  } else if (isSelectorPattern(value)) {
    // CSS selector pattern without condition
    const selectorObject = ensureNestedObject(styleObject, property)
    Object.assign(selectorObject, value)
  } else {
    // Regular base style
    styleObject[property] = value
  }
}

/**
 * Converts a classList string back to a Panda CSS style object
 * Handles real-world class names without needing prior encoding
 *
 * @param classList - Space-separated class names (e.g., "fs_2rem sm:fs_3rem ls_tight")
 * @returns Style object representing the original styles
 *
 * @example
 * reverseSplitter("fs_2.5rem sm:fs_3rem ls_tight fw_bold lh_1.2 max-w_40rem md:max-w_unset")
 * // Returns:
 * // {
 * //   fontSize: "2.5rem",
 * //   sm: { fontSize: "3rem" },
 * //   letterSpacing: "tight",
 * //   fontWeight: "bold",
 * //   lineHeight: 1.2,
 * //   maxWidth: "40rem",
 * //   md: { maxWidth: "unset" }
 * // }
 */
export function reverseSplitter(classList: string): Record<string, any> {
  const classNames = classList.split(/\s+/).filter(Boolean)
  const styleObject: Record<string, any> = {}

  for (const className of classNames) {
    const parsed = parseClassName(className)
    if (parsed) {
      applyParsedClass(styleObject, parsed)
    }
  }

  return styleObject
}
