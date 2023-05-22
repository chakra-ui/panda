
/**
 * Check if a token is responsive expression or not
 */
export function isResponsiveToken (token) { return !!((token?.value as any || token)?.initial) }

/**
 * Return stringified value of a token (to display in hints).
 */
export function stringifiedValue (token) {
  return isResponsiveToken(token)
    ? Object.entries(token.value).map(([key, value]) => `@${key}: ${value}`).join('\n')
    : token.value?.toString() || token?.value
}
