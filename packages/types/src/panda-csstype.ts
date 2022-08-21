import type { PropertiesFallback, SimplePseudos } from './csstype'

type Loose = string & { __type?: never }
// type Clean<T> = Exclude<T, { __type?: never }>

export type Properties = PropertiesFallback<undefined>

export type CssProperty = keyof Properties

export type CssProperties = Properties & {
  [key in `--${string}`]: string | number | undefined
}

export type CssKeyframes = {
  [time: string]: {
    [T in Loose | 'from' | 'to']?: CssProperties
  }
}

type ConditionalValue<C extends Record<string, string>, V> =
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
}

type PseudoProperty = `&${SimplePseudos}`

type MixedCssProperties<T> = T & {
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
  StrictValue extends boolean = false,
> = MixedCssProperties<ConditionCssProperties<Conditions, UserProperties, StrictValue>>

export {}
