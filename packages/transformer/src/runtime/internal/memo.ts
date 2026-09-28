type Props = Record<string, unknown>
type Resolve<T> = (props?: Props) => T
type Memoized<T> = (props?: Props | null) => T

const TABLE_MAX_SLOTS = 256
const RING_ROWS = 16

const isMutable = (value: unknown) => value !== null && (typeof value === 'object' || typeof value === 'function')

/** Values every variant lookup handles the same way: an option, or no class at all. */
const KNOWN_MISSES = ['true', 'false', 'null']

/**
 * One slot per option combination. Variant lookups coerce the prop to a property key, so `true` and
 * `'true'` pick the same class; compounds compare strictly (`v === true`). With compounds (`strict`),
 * booleans and `null` get states of their own instead of sharing the string they coerce to.
 */
function tableMemo<T>(
  resolve: Resolve<T>,
  keys: string[],
  variantMap: Record<string, string[]>,
  strict: boolean,
): Memoized<T> | null {
  let slots = 1
  const radixes: number[] = []
  const trueStates: number[] = []
  const falseStates: number[] = []
  const nullStates: number[] = []
  const states = keys.map((key) => {
    const state: Record<string, number> = Object.create(null)
    let count = 1
    for (const option of variantMap[key]!) state[option] = count++
    if (strict) {
      trueStates.push(count++)
      falseStates.push(count++)
      nullStates.push(count++)
    } else {
      // `false` and `null` never name an inherited property, so an undeclared one resolves to no class.
      for (const value of KNOWN_MISSES) state[value] ??= count++
      trueStates.push(state.true!)
      falseStates.push(state.false!)
      nullStates.push(state.null!)
    }
    radixes.push(count)
    slots *= count
    return state
  })
  if (slots > TABLE_MAX_SLOTS) return null

  const table: (T | undefined)[] = new Array(slots)
  let noProps: T | undefined
  return (props) => {
    if (props == null) return noProps === undefined ? (noProps = resolve()) : noProps
    let slot = 0
    for (let i = 0; i < keys.length; i++) {
      const value = props[keys[i]!]
      let state: number | undefined = 0
      if (value === true) state = trueStates[i]
      else if (value === false) state = falseStates[i]
      else if (value === null) state = nullStates[i]
      else if (typeof value === 'string') state = states[i]![value]
      else if (value !== undefined) {
        // Numbers coerce for lookups but never match a compound, so only the lenient table keys them.
        if (strict || isMutable(value)) return resolve(props)
        state = states[i]![String(value)]
      }
      if (state === undefined) return resolve(props)
      slot = slot * radixes[i]! + state
    }
    let result = table[slot]
    if (result === undefined) table[slot] = result = resolve(props)
    return result
  }
}

/** The last few prop tuples, compared with `===`. No key strings, so a miss costs only the scan. */
function ringMemo<T>(resolve: Resolve<T>, keys: string[]): Memoized<T> {
  const width = keys.length
  const values: unknown[] = new Array(RING_ROWS * width)
  const results: T[] = new Array(RING_ROWS)
  let written = 0
  let next = 0
  let noProps: T | undefined
  return (props) => {
    if (props == null) return noProps === undefined ? (noProps = resolve()) : noProps
    scan: for (let row = 0; row < written; row++) {
      const start = row * width
      for (let i = 0; i < width; i++) {
        if (props[keys[i]!] !== values[start + i]) continue scan
      }
      return results[row]!
    }
    for (let i = 0; i < width; i++) {
      if (isMutable(props[keys[i]!])) return resolve(props)
    }
    const result = resolve(props)
    const start = next * width
    for (let i = 0; i < width; i++) values[start + i] = props[keys[i]!]
    results[next] = result
    if (next === written) written++
    next = (next + 1) % RING_ROWS
    return result
  }
}

/**
 * Memoize a compiler-specialized recipe. `variantMap` lists every prop the function reads; the
 * compiler only specializes recipes whose compounds select on declared variants.
 */
export function memoRecipe<T>(
  resolve: Resolve<T>,
  variantMap: Record<string, string[]>,
  hasCompounds?: unknown,
): Memoized<T> {
  const keys = Object.keys(variantMap)
  // Compiled resolvers normalize a missing props object themselves (`p ??= {}`).
  if (keys.length === 0) return resolve as Memoized<T>
  return tableMemo(resolve, keys, variantMap, !!hasCompounds) ?? ringMemo(resolve, keys)
}
