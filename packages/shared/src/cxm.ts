/**
 * Split a className by ':' while respecting bracket boundaries.
 * Colons inside [...] are NOT treated as separators.
 *
 * @example
 * splitClassName('hover:c_red') // ['hover', 'c_red']
 * splitClassName('[&::placeholder]:c_red') // ['[&::placeholder]', 'c_red']
 */
export function splitClassName(className: string): string[] {
  const segments: string[] = []
  let current = ''
  let bracketDepth = 0

  for (let i = 0; i < className.length; i++) {
    const ch = className[i]

    if (ch === '[') {
      bracketDepth++
      current += ch
    } else if (ch === ']') {
      bracketDepth--
      current += ch
    } else if (ch === ':' && bracketDepth === 0) {
      if (current) segments.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  if (current) segments.push(current)
  return segments
}

/**
 * Extract the merge key from a Panda className.
 *
 * The merge key uniquely identifies the "slot" a class occupies:
 * same conditions + same property = conflict.
 *
 * @param className - a single className token (no spaces)
 * @param separator - the property/value separator from config ('_', '=', or '-')
 * @returns merge key string, or null if not a recognized Panda class
 *
 * @example
 * getMergeKey('px_4', '_')           // 'px'
 * getMergeKey('hover:px_4', '_')     // 'hover:px'
 * getMergeKey('c_red!', '_')         // 'c'
 * getMergeKey('my-custom-class', '_') // null
 */
export function getMergeKey(className: string, separator: string): string | null {
  let cls = className
  if (cls.endsWith('!')) {
    cls = cls.slice(0, -1)
  }

  const segments = splitClassName(cls)
  if (segments.length === 0) return null

  const last = segments[segments.length - 1]

  const sepIdx = last.indexOf(separator)
  if (sepIdx < 1) return null

  const property = last.slice(0, sepIdx)

  if (segments.length === 1) {
    return property
  }

  const conditions = segments.slice(0, -1).join(':')
  return conditions + ':' + property
}

/**
 * Merge className strings, deduplicating conflicting Panda utility classes.
 * Last occurrence wins for classes targeting the same CSS property + conditions.
 *
 * Two classes conflict iff they have the same merge key (conditions + property).
 *
 * @param separator - the property/value separator from config ('_', '=', or '-')
 * @param classes - className strings to merge
 *
 * @example
 * cxm('_', 'px_4', 'px_2')                → 'px_2'
 * cxm('_', 'hover:px_4', 'hover:px_2')    → 'hover:px_2'
 * cxm('_', 'px_4', 'hover:px_2')          → 'px_4 hover:px_2'
 * cxm('_', 'px_4 mt_2', 'px_2')           → 'mt_2 px_2'
 * cxm('_', 'c_red!', 'c_blue')            → 'c_blue'
 */
export function cxm(separator: string, ...classes: (string | undefined | null | false)[]): string {
  const seen = new Map<string, string>()
  const order: string[] = []
  let id = 0

  for (const cls of classes) {
    if (!cls) continue
    for (const token of cls.split(' ')) {
      if (!token) continue
      const key = getMergeKey(token, separator)
      if (key !== null) {
        if (!seen.has(key)) order.push(key)
        seen.set(key, token)
      } else {
        const uniqueKey = `__` + id++
        order.push(uniqueKey)
        seen.set(uniqueKey, token)
      }
    }
  }

  let str = ''
  for (let i = 0; i < order.length; i++) {
    if (str) str += ' '
    str += seen.get(order[i])!
  }
  return str
}
