export type PandaClassPart = string | false | null | undefined | PandaClassPart[]

export type CxSeparator = '_' | '=' | '-'

export interface CxOptions {
  /** Panda `config.separator` — defaults to `_`. */
  separator?: CxSeparator | string
}

declare const __PANDA_CX_SEPARATOR__: string | undefined

const bakedSeparator =
  typeof __PANDA_CX_SEPARATOR__ !== 'undefined' && __PANDA_CX_SEPARATOR__ ? __PANDA_CX_SEPARATOR__ : '_'

/** Split a className by ':' while respecting bracket boundaries. */
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

/** Merge key for one Panda atomic class token (conditions + property). */
export function getMergeKey(className: string, separator: string): string | null {
  let cls = className
  if (cls.endsWith('!')) {
    cls = cls.slice(0, -1)
  }

  const segments = splitClassName(cls)
  if (segments.length === 0) return null

  const last = segments[segments.length - 1]!
  const sepIdx = last.indexOf(separator)
  if (sepIdx < 1) return null

  const property = last.slice(0, sepIdx)

  if (segments.length === 1) {
    return property
  }

  const conditions = segments.slice(0, -1).join(':')
  return `${conditions}:${property}`
}

function flattenParts(parts: PandaClassPart[], out: string[]) {
  for (const part of parts) {
    if (!part) continue

    if (Array.isArray(part)) {
      flattenParts(part, out)
      continue
    }

    if (part === '') continue
    out.push(part)
  }
}

function mergeClassStrings(separator: string, classes: readonly string[]): string {
  const seen = new Map<string, string>()
  const order: string[] = []
  let id = 0

  for (const cls of classes) {
    for (const token of cls.split(' ')) {
      if (!token) continue
      const key = getMergeKey(token, separator)
      if (key !== null) {
        if (!seen.has(key)) order.push(key)
        seen.set(key, token)
      } else {
        const uniqueKey = `__${id++}`
        order.push(uniqueKey)
        seen.set(uniqueKey, token)
      }
    }
  }

  let str = ''
  for (let i = 0; i < order.length; i++) {
    if (str) str += ' '
    str += seen.get(order[i]!)!
  }
  return str
}

/** Build a transform-time `cx` helper bound to the project separator. */
export function createCx(options: CxOptions = {}) {
  const separator = options.separator ?? bakedSeparator

  return function cx(...parts: PandaClassPart[]): string {
    const flat: string[] = []
    flattenParts(parts, flat)
    return mergeClassStrings(separator, flat)
  }
}

/** Default transform-time `cx` — mirrors styled-system naming with Panda merge semantics. */
export const cx = createCx()
