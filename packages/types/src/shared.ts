type Primitive = string | number | boolean | null | undefined

export type LiteralUnion<T, K extends Primitive = string> = T | (K & Record<never, never>)

export interface Recursive<T> {
  [key: string]: T | Recursive<T>
}

export type Dict<T = any> = Record<string, T>

export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

export type AnyFunction<T = any> = (...args: T[]) => any

type Nullable<T> = T | null | undefined

export interface ArtifactContent {
  file: string
  code: string | undefined
}

export type ArtifactId =
  | 'helpers'
  | 'keyframes'
  | 'design-tokens'
  | 'types'
  | 'css-fn'
  | 'cva'
  | 'sva'
  | 'cx'
  | 'create-recipe'
  | 'recipes'
  | 'recipes-index'
  | 'patterns'
  | 'patterns-index'
  | 'jsx-is-valid-prop'
  | 'jsx-helpers'
  | 'jsx-factory'
  | 'jsx-patterns'
  | 'jsx-patterns-index'
  | 'css-index'
  | 'reset.css'
  | 'global.css'
  | 'static.css'
  | 'package.json'
  | 'styles.css'
  | (string & {})
export type Artifact = Nullable<{
  id: ArtifactId
  dir?: string[]
  files: ArtifactContent[]
}>
