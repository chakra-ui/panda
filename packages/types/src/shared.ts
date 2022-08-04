export type Loose = string & {};

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [Key in Extract<keyof T, string>]: [Key, ...PathsToStringProps<T[Key]>];
    }[Extract<keyof T, string>];

type Join<Paths extends string[], Delimiter extends string> = Paths extends []
  ? never
  : Paths extends [infer Property]
  ? Property
  : Paths extends [infer Property, ...infer Rest]
  ? Property extends string
    ? `${Property}${Delimiter}${Join<Extract<Rest, string[]>, Delimiter>}`
    : never
  : string;

export type TDotPath = Record<string, any> | string;

export type DotPath<T extends TDotPath> = Join<PathsToStringProps<T>, '.'>;

export type Primitive = string | number | boolean | null | undefined;

export type Entry<T> = [keyof T, T[keyof T]];
