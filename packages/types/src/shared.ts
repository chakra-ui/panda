export type Primitive = string | number | boolean | null | undefined

export type LiteralUnion<T, K extends Primitive = string> = T | (K & Record<never, never>)

export type Recursive<T> = { [key: string]: T | Recursive<T> }

export type Entry<T> = [keyof T, T[keyof T]]

export type Dict<T = any> = Record<string, T>

export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

export type AnyFunction<T = any> = (...args: T[]) => any

export type StringKeyOf<T> = Extract<keyof T, string>

export type Extendable<T> = T & { extend?: T }

type Nullable<T> = T | null | undefined

export type UnwrapExtend<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Nullable<Extendable<infer U>> ? U : T[K]
}
