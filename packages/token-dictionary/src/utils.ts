import { isObject } from '@css-panda/shared'
import type { TokenEntry } from './token.types'

/* -----------------------------------------------------------------------------
 * Token references
 * -----------------------------------------------------------------------------*/

/**
 * Regex for matching a tokenized reference.
 */
const REFERENCE_REGEX = /(\$[^\s,]+\w)|({([^}]*)})/g

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
  return matches.map((match) => match.replace(/[{}]/g, '')).map((value) => value.trim())
}

export function hasReference(value: string) {
  return REFERENCE_REGEX.test(value)
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

export const isToken = (value: any): value is TokenEntry => {
  return isObject(value) && 'value' in value
}

export function assertTokenFormat(token: any): asserts token is TokenEntry {
  if (!isToken(token)) {
    throw new Error(`Invalid token format: ${JSON.stringify(token)}`)
  }
}
