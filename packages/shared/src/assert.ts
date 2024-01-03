export const isString = (v: any): v is string => typeof v === 'string'
export const isBoolean = (v: any): v is boolean => typeof v === 'boolean'

type AnyFunction = (...args: any[]) => any
export const isFunction = (v: any): v is AnyFunction => typeof v === 'function'

export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}
