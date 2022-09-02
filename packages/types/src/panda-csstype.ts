import type * as CSS from './csstype'

type Loose = string & { __type?: never }
// type Clean<T> = Exclude<T, { __type?: never }>

export type Properties = CSS.PropertiesFallback<Loose>

export type CssProperty = keyof Properties

type PseudoProperty = `&${CSS.SimplePseudos}`

export type CssProperties = Properties & {
  [key: string]: string | number | Record<string, any> | undefined
}

export type Keyframes = Record<string, { [time: string]: CssProperties }>

export type ConditionalValue<C extends Record<string, string>, V> =
  // NOTE: When using Clean<V>, it doesn't allow arbrtrary values. So I removed it.
  | V
  | {
      [Key in keyof C]?: ConditionalValue<C, V>
    }

type Union<Key extends string, CssProperties extends Record<Key, any>, UserProperties> = UserProperties extends {
  __type?: 'never'
}
  ? CssProperties[Key]
  : Key extends keyof UserProperties
  ? CssProperties[Key] | UserProperties[Key]
  : CssProperties[Key]

type Strict<
  Key extends string,
  CssProperties extends Record<Key, any>,
  UserProperties,
> = Key extends keyof UserProperties ? UserProperties[Key] : CssProperties[Key]

type ConditionCssProperties<
  Conditions extends Record<string, string>,
  UserProperties extends Record<string, string> = { __type?: 'never' },
  StrictValue extends boolean = false,
> = {
  [Key in keyof Properties]?: ConditionalValue<
    Conditions,
    true extends StrictValue ? Strict<Key, Properties, UserProperties> : Union<Key, Properties, UserProperties>
  >
} & {
  [Key in keyof Omit<UserProperties, keyof Properties>]?: ConditionalValue<Conditions, UserProperties[Key]>
}

export type WithNesting<T> = T & {
  selectors?: {
    [key in PseudoProperty | Loose]?: T
  }
  '@media'?: {
    [query: string]: T
  }
}

export type CssObject<
  Conditions extends Record<string, string>,
  UserProperties extends Record<string, string> = { __type?: 'never' },
  Strict extends boolean = false,
> = WithNesting<ConditionCssProperties<Conditions, UserProperties, Strict>>

export {}
