type Primitive = string | number | boolean | null | undefined

export type LiteralUnion<T, K extends Primitive = string> = T | (K & Record<never, never>)

export interface Recursive<T> {
  [key: string]: T | Recursive<T>
}

export type Dict<T = any> = Record<string, T>

export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

export type AnyFunction<T = any> = (...args: T[]) => any

export type Nullable<T> = T | null | undefined

export type Keys<T> = keyof NonNullable<T>

type Subtract<T extends number, D extends number> = T extends D ? 0 : T extends D | any ? Exclude<T, D> : never

/**
 * Get all the (nested) paths of an object until a certain depth
 * e.g. Paths<{a: {b: {c: 1}}}, '', 2> => 'a' | 'a.b' | 'a.b.c'
 */
type Paths<T, Prefix extends string = '', Depth extends number = 0> = {
  [K in keyof T]: Depth extends 0
    ? never
    : T[K] extends object
    ? K extends string
      ? `${Prefix}${K}` | Paths<T[K], `${Prefix}${K}.`, Depth extends 1 ? 0 : Subtract<Depth, 1>>
      : never
    : K extends string | number
    ? `${Prefix}${K}`
    : never
}[keyof T]

export type PathIn<T, Key extends keyof T> = Key extends string ? Paths<T[Key], `${Key}.`, 1> : never

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
