export type PandaClassPart = string | false | null | undefined | PandaClassPart[]

export type CxSeparator = '_' | '=' | '-'

export interface CxOptions {
  /** Panda `config.separator` — defaults to `_`. */
  separator?: CxSeparator | string
}

declare const __PANDA_CX_SEPARATOR__: string | undefined

const bakedSeparator =
  typeof __PANDA_CX_SEPARATOR__ !== 'undefined' && __PANDA_CX_SEPARATOR__ ? __PANDA_CX_SEPARATOR__ : '_'

const CHAR_OPEN_BRACKET = 91 // [
const CHAR_CLOSE_BRACKET = 93 // ]
const CHAR_COLON = 58 // :

/** Split a className by ':' while respecting bracket boundaries. */
export function splitClassName(className: string): string[] {
  const segments: string[] = []
  let start = 0
  let bracketDepth = 0

  for (let i = 0; i < className.length; i++) {
    const code = className.charCodeAt(i)
    if (code === CHAR_OPEN_BRACKET) {
      bracketDepth++
    } else if (code === CHAR_CLOSE_BRACKET) {
      bracketDepth--
    } else if (code === CHAR_COLON && bracketDepth === 0) {
      if (i > start) segments.push(className.slice(start, i))
      start = i + 1
    }
  }

  if (start < className.length) segments.push(className.slice(start))
  return segments
}

/** Merge key for one Panda atomic class token (conditions + property). */
export function getMergeKey(className: string, separator: string): string | null {
  let end = className.length
  if (end > 0 && className.charCodeAt(end - 1) === 33) {
    // trailing `!`
    end -= 1
  }
  if (end === 0) return null

  let bracketDepth = 0
  let lastColon = -1
  for (let i = 0; i < end; i++) {
    const code = className.charCodeAt(i)
    if (code === CHAR_OPEN_BRACKET) {
      bracketDepth++
    } else if (code === CHAR_CLOSE_BRACKET) {
      bracketDepth--
    } else if (code === CHAR_COLON && bracketDepth === 0) {
      lastColon = i
    }
  }

  const propStart = lastColon + 1
  const sepIdx = className.indexOf(separator, propStart)
  if (sepIdx < propStart + 1 || sepIdx >= end) return null

  const property = className.slice(propStart, sepIdx)
  if (lastColon === -1) return property
  return `${className.slice(0, lastColon)}:${property}`
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
    let tokenStart = 0
    for (let i = 0; i <= cls.length; i++) {
      if (i !== cls.length && cls.charCodeAt(i) !== 32) continue
      if (i === tokenStart) {
        tokenStart = i + 1
        continue
      }

      const token = cls.slice(tokenStart, i)
      tokenStart = i + 1

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

  if (order.length === 0) return ''
  if (order.length === 1) return seen.get(order[0]!)!

  let str = seen.get(order[0]!)!
  for (let i = 1; i < order.length; i++) {
    str += ` ${seen.get(order[i]!)!}`
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
