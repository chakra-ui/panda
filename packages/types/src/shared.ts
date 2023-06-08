type Primitive = string | number | boolean | null | undefined

export type LiteralUnion<T, K extends Primitive = string> = T | (K & Record<never, never>)

export type Recursive<T> = { [key: string]: T | Recursive<T> }

export type Dict<T = any> = Record<string, T>

export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

export type AnyFunction<T = any> = (...args: T[]) => any

type DeepPartial<T> = {
  [P in keyof T]+?: DeepPartial<T[P]>
}

export type Extendable<T extends Record<any, any>> = T | { extend?: DeepPartial<T> }

type Nullable<T> = T | null | undefined

export type UnwrapExtend<T> = {
  [K in keyof T]: T[K] extends Nullable<Extendable<infer U>> ? U : T[K]
}

export type Artifact = Nullable<{
  dir?: string[]
  files: Array<{
    file: string
    code: string | undefined
  }>
}>
