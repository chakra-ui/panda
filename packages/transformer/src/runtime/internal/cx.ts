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

  // Conditions and property are the prefix up to the separator: `md:hover:bg_red` → `md:hover:bg`.
  return className.slice(0, sepIdx)
}

const CACHE_LIMIT = 2048
const CHAR_SPACE = 32
const CHAR_BANG = 33
/** Int32 fields recorded per token: start, end, merge-key end (`-1` when unowned), key hash. */
const FIELDS = 4

/** Two generations, swapped when the current one fills up: bounded memory, cheap eviction. */
function createCache<V>(limit = CACHE_LIMIT) {
  let size = 0
  let current = new Map<string, V>()
  let previous = new Map<string, V>()
  const set = (key: string, value: V) => {
    current.set(key, value)
    if (++size > limit) {
      size = 0
      previous = current
      current = new Map()
    }
  }
  return {
    get(key: string): V | undefined {
      let value = current.get(key)
      if (value === undefined && (value = previous.get(key)) !== undefined) set(key, value)
      return value
    },
    set,
  }
}

/**
 * Scan one class string into `out` from `offset`: per token its bounds, the end of its merge key
 * (conditions and property, up to the separator after the last top-level `:`), and an FNV-1a hash of
 * that key. Returns the token count, negated when the spacing isn't single-space clean.
 * Returns `0` for a part with no classes.
 */
function scanPart(part: string, separator: string, out: Int32Array, offset: number): number {
  let count = 0
  let clean = part.length > 0
  let start = 0
  for (let i = 0; i <= part.length; i++) {
    const code = i === part.length ? CHAR_SPACE : part.charCodeAt(i)
    // ASCII whitespace separates classes, so multi-line template literals merge too.
    if (code !== CHAR_SPACE && (code < 9 || code > 13)) continue
    if (code !== CHAR_SPACE || i === start) clean = false
    if (i === start) {
      start = i + 1
      continue
    }
    const at = offset + count * FIELDS
    count++
    out[at] = start
    out[at + 1] = i
    out[at + 2] = -1
    let end = i
    if (part.charCodeAt(end - 1) === CHAR_BANG) end--
    let depth = 0
    let propStart = start
    for (let c = start; c < end; c++) {
      const code = part.charCodeAt(c)
      if (code === CHAR_OPEN_BRACKET) depth++
      else if (code === CHAR_CLOSE_BRACKET) depth--
      else if (code === CHAR_COLON && depth === 0) propStart = c + 1
    }
    const sep = part.indexOf(separator, propStart)
    if (sep > propStart && sep < end) {
      let hash = 0x811c9dc5
      for (let c = start; c < sep; c++) hash = Math.imul(hash ^ part.charCodeAt(c), 0x01000193)
      out[at + 2] = sep
      out[at + 3] = hash
    }
    start = i + 1
  }
  return clean ? count : -count
}

/** Build a transform-time `cx` helper bound to the project separator. */
export function createCx(options: CxOptions = {}) {
  const separator = options.separator ?? bakedSeparator
  const scanned = createCache<Int32Array>()
  // A part enters `scanned` on its second sighting, so one-off class strings never fill it.
  const seenOnce = createCache<true>(512)

  // Scratch reused across calls; `cx` never re-enters itself.
  const parts: string[] = []
  let tokens = new Int32Array(64 * FIELDS)
  let tokenPart = new Int32Array(64)
  let winner = new Int32Array(64)
  let tableSize = 128
  let table = new Int32Array(tableSize)
  let stamps = new Int32Array(tableSize)
  let stamp = 0

  function collect(value: PandaClassPart) {
    if (!value) return
    if (typeof value === 'string') parts.push(value)
    else for (let i = 0; i < value.length; i++) collect(value[i])
  }

  function reserve(tokenCount: number) {
    if (tokenCount <= tokenPart.length) return
    let size = tokenPart.length
    while (size < tokenCount) size *= 2
    const grow = (from: Int32Array, length: number) => {
      const next = new Int32Array(length)
      next.set(from)
      return next
    }
    tokens = grow(tokens, size * FIELDS)
    tokenPart = grow(tokenPart, size)
    winner = grow(winner, size)
  }

  function sameKey(a: number, b: number): boolean {
    const aStart = tokens[a * FIELDS]!
    const bStart = tokens[b * FIELDS]!
    const length = tokens[a * FIELDS + 2]! - aStart
    if (tokens[b * FIELDS + 2]! - bStart !== length) return false
    const left = parts[tokenPart[a]!]!
    const right = parts[tokenPart[b]!]!
    for (let i = 0; i < length; i++) {
      if (left.charCodeAt(aStart + i) !== right.charCodeAt(bStart + i)) return false
    }
    return true
  }

  /** First position keeps the slot, the last class for a key wins it. */
  function merge(): string {
    let count = 0
    let clean = true
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p]!
      const cached = scanned.get(part)
      let partCount: number
      if (cached !== undefined) {
        partCount = cached[0]!
        reserve(count + Math.abs(partCount))
        const base = count * FIELDS
        for (let i = 1; i < cached.length; i++) tokens[base + i - 1] = cached[i]!
      } else {
        reserve(count + part.length)
        partCount = scanPart(part, separator, tokens, count * FIELDS)
        if (seenOnce.get(part) === undefined) seenOnce.set(part, true)
        else {
          const record = new Int32Array(1 + Math.abs(partCount) * FIELDS)
          record[0] = partCount
          record.set(tokens.subarray(count * FIELDS, (count + Math.abs(partCount)) * FIELDS), 1)
          scanned.set(part, record)
        }
      }
      if (partCount <= 0) clean = false
      const end = count + Math.abs(partCount)
      for (; count < end; count++) tokenPart[count] = p
    }

    if (count * 2 > tableSize) {
      while (count * 2 > tableSize) tableSize *= 2
      table = new Int32Array(tableSize)
      stamps = new Int32Array(tableSize)
      stamp = 0
    }
    if (++stamp === 0x7fffffff) {
      stamp = 1
      stamps.fill(0)
    }
    const mask = tableSize - 1
    let replaced = false
    for (let t = 0; t < count; t++) {
      winner[t] = t
      if (tokens[t * FIELDS + 2]! < 0) continue
      const hash = tokens[t * FIELDS + 3]!
      let slot = hash & mask
      let owner = -1
      while (stamps[slot] === stamp) {
        const candidate = table[slot]!
        if (tokens[candidate * FIELDS + 3] === hash && sameKey(candidate, t)) {
          owner = candidate
          break
        }
        slot = (slot + 1) & mask
      }
      if (owner === -1) {
        stamps[slot] = stamp
        table[slot] = t
      } else {
        winner[owner] = t
        winner[t] = -1
        replaced = true
      }
    }

    if (!replaced && clean) {
      let joined = parts[0]!
      for (let p = 1; p < parts.length; p++) joined += ' ' + parts[p]!
      return joined
    }
    let result = ''
    for (let t = 0; t < count; t++) {
      const w = winner[t]!
      if (w === -1) continue
      const piece = parts[tokenPart[w]!]!.slice(tokens[w * FIELDS]!, tokens[w * FIELDS + 1]!)
      result = result ? result + ' ' + piece : piece
    }
    return result
  }

  return function cx(...args: PandaClassPart[]): string {
    parts.length = 0
    for (let i = 0; i < args.length; i++) collect(args[i])
    const count = parts.length
    // Every producer of a Panda class string — the transform's class printer,
    // `css()`, a nested `cx` — emits merge-key-conflict-free output, so a lone
    // string has nothing left to merge and tokenizing it is pure cost. This is
    // the hot path: `cx(staticClasses, props.className)` with no `className`.
    if (count === 0) return ''
    if (count === 1) return parts[0]!

    return merge()
  }
}

/** Default transform-time `cx` — mirrors styled-system naming with Panda merge semantics. */
export const cx = /* @__PURE__ */ createCx()
