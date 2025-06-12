import { logger } from '@pandacss/logger'
import { PandaError, esc, isObject } from '@pandacss/shared'
import type { Token } from '@pandacss/types'

/* -----------------------------------------------------------------------------
 * Token references
 * -----------------------------------------------------------------------------*/

/**
 * Regex for matching a tokenized reference.
 */
const REFERENCE_REGEX = /({([^}]*)})/g
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

export const hasReference = (value: string) => getReferences(value).length > 0

const tokenFunctionRegex = /token\(([^)]+)\)/g
const closingParenthesisRegex = /\)$/g
const hasTokenReference = (str: string) => str.includes('token(')

const tokenReplacer = (a: string, b?: string) =>
  b ? (a.endsWith(')') ? a.replace(closingParenthesisRegex, `, ${b})`) : `var(${a}, ${b})`) : a

const notFoundMessage = (key: string, value: string) => `Reference not found: \`${key}\` in "${value}"`

const isTokenReference = (v: string) => hasReference(v) || hasTokenReference(v)

export function expandReferences(value: string, fn: (key: string) => string) {
  if (!isTokenReference(value)) return value

  const references = getReferences(value)

  const expanded = references.reduce((valueStr, key) => {
    const resolved = fn(key)
    if (!resolved) {
      logger.warn('token', notFoundMessage(key, value))
    }
    const expandedValue = resolved ?? esc(key)

    return valueStr.replace(`{${key}}`, expandedValue)
  }, value)

  if (!expanded.includes(`token(`)) return expanded

  return expanded.replace(tokenFunctionRegex, (_, token) => {
    const [tokenValue, tokenFallback] = token.split(',').map((s: string) => s.trim())

    const result = [tokenValue, tokenFallback].filter(Boolean).map((key) => {
      const resolved = fn(key)

      if (!resolved && isTokenReference(key)) {
        logger.warn('token', notFoundMessage(key, value))
      }

      return resolved ?? esc(key)
    })

    if (result.length > 1) {
      const [a, b] = result
      return tokenReplacer(a, b)
    }

    return tokenReplacer(result[0])
  })
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
    throw new PandaError('INVALID_TOKEN', `Invalid token format: ${JSON.stringify(token)}`)
  }
}
