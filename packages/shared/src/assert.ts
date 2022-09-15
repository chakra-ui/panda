export const isString = (v: any): v is string => typeof v === 'string'

type AnyFunction = (...args: any[]) => any
export const isFunction = (v: any): v is AnyFunction => typeof v === 'function'
