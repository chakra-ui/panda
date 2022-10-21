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
  const matches = value.match(REFERENCE_REGEX)
  if (!matches) return []
  return matches.map((match) => match.replace(/[{}]/g, '')).map((value) => value.trim())
}

export function hasReference(value: string) {
  return REFERENCE_REGEX.test(value)
}
