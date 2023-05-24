import { Token } from '@pandacss/types'

/**
 * Check if a token is responsive expression or not
 */
export function isResponsiveToken(token: Token) {
  return !!(token?.value || token)?.initial
}

/**
 * Return stringified value of a token (to display in hints).
 */
export function stringifiedValue(token: Token) {
  return isResponsiveToken(token)
    ? Object.entries(token.value)
        .map(([key, value]) => `@${key}: ${value}`)
        .join('\n')
    : token.value?.toString() || token?.value
}
