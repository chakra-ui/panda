import { isObject } from '@pandacss/shared'
import type { Token } from '@pandacss/types'

/* -----------------------------------------------------------------------------
 * Token references
 * -----------------------------------------------------------------------------*/

/**
 * Regex for matching a tokenized reference.
 */
const REFERENCE_REGEX = /(\$[^\s,]+\w)|({([^}]*)})/g
const curlyBracketRegex = /[{}]/g

/**
 * Returns all references in a string
 *
 * @example
 *
 * `{colors.red.300} {sizes.sm}` => ['colors.red.300', 'sizes.sm']
 */
export function getReferences(value: string) {
  if (typeof value !== 'string') return []
  const matches = value.match(REFERENCE_REGEX)
  if (!matches) return []
  return matches.map((match) => match.replace(curlyBracketRegex, '')).map((value) => value.trim())
}

export function hasReference(value: string) {
  return REFERENCE_REGEX.test(value)
}

export function expandReferences(value: string, fn: (key: string) => string) {
  if (!hasReference(value)) return value
  const references = getReferences(value)
  return references.reduce((valueStr, key) => {
    const value = fn(key) ?? key
    return valueStr.replace(`{${key}}`, value)
  }, value)
}

/* -----------------------------------------------------------------------------
 * Shared token utilities
 * -----------------------------------------------------------------------------*/

/**
 * Converts a JS Map to an object
 */
export function mapToJson(map: Map<string, any>) {
  const obj: Record<string, unknown> = {}
  map.forEach((value, key) => {
    if (value instanceof Map) {
      obj[key] = Object.fromEntries(value)
    } else {
      obj[key] = value
    }
  })
  return obj
}

/* -----------------------------------------------------------------------------
 * Token assertions
 * -----------------------------------------------------------------------------*/

export const isToken = (value: any): value is Token => {
  return isObject(value) && 'value' in value
}

export function assertTokenFormat(token: any): asserts token is Token {
  if (!isToken(token)) {
    throw new Error(`Invalid token format: ${JSON.stringify(token)}`)
  }
}
