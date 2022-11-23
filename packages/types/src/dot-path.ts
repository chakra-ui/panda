type CastToString<T> = T extends number ? `${T}` : T

type PathsToStringProps<T> = T extends string | number
  ? []
  : {
      [Key in Extract<keyof T, string | number>]: [CastToString<Key>, ...PathsToStringProps<T[Key]>]
    }[Extract<keyof T, string | number>]

type Join<Paths extends string[], Delimiter extends string> = Paths extends []
  ? never
  : Paths extends [infer Property]
  ? Property
  : Paths extends [infer Property, ...infer Rest]
  ? Property extends string
    ? `${Property}${Delimiter}${Join<Extract<Rest, string[]>, Delimiter>}`
    : never
  : string

type TDotPath = Record<string, any> | string

export type DotPath<T extends TDotPath> = Join<PathsToStringProps<T>, '.'>
