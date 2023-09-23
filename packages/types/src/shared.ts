type Primitive = string | number | boolean | null | undefined

export type LiteralUnion<T, K extends Primitive = string> = T | (K & Record<never, never>)

export interface Recursive<T> {
  [key: string]: T | Recursive<T>
}

export type Dict<T = any> = Record<string, T>

export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

export type AnyFunction<T = any> = (...args: T[]) => any

type Nullable<T> = T | null | undefined

export type Artifact = Nullable<{
  dir?: string[]
  files: Array<{
    file: string
    code: string | undefined
  }>
}>
