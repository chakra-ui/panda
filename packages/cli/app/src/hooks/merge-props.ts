import type { AnyFunction } from '@pandacss/types'

/** Returns a callback that will call all functions passed with the same arguments */
export const callAll =
  <Args = any, Fns extends Function = AnyFunction<Args>>(...fns: Fns[]) =>
  (...args: Args[]) =>
    fns.forEach((fn) => fn?.(...args))

export const mergeProps = <Left extends Record<string, any>, Right extends Partial<Left & {}>>(
  left: Left,
  right: Right,
) => {
  const result = { ...left, ...right }
  for (const key in result) {
    if (typeof left[key] === 'function' && typeof right[key] === 'function') {
      ;(result as any)[key] = callAll(left[key], right[key])
    }
  }
  return result
}
