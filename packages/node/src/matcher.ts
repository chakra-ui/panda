/**
 * Acts like a .gitignore matcher
 * e.g a list of string to search for nested path with glob and exclusion allowed
 * ["outdir", "theme.recipes", '*.css', '!aaa.*.bbb']
 */
export function createMatcher(id: string, patterns: string[]) {
  if (!patterns?.length) return () => undefined

  const includePatterns = [] as string[]
  const excludePatterns = [] as string[]
  const deduped = new Set(patterns)

  // Separate inclusion and exclusion patterns
  deduped.forEach((pattern) => {
    // replace '*' with '.*' for regex matching
    const regexString = pattern.replace(/\*/g, '.*')
    if (pattern.startsWith('!')) {
      excludePatterns.push(regexString.slice(1))
    } else {
      includePatterns.push(regexString)
    }
  })

  const include = new RegExp(includePatterns.join('|'))
  const exclude = new RegExp(excludePatterns.join('|'))

  return (path: string) => {
    if (excludePatterns.length && exclude.test(path)) return
    return include.test(path) ? id : undefined
  }
}
