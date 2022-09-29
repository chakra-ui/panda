import { PropertiesFallback, SimplePseudos } from './csstype'

type Loose = string & { __type?: never }
// type Clean<T> = Exclude<T, { __type?: never }>

type ContainerProperties = {
  container?: string
  containerType?: 'size' | 'inline-size' | (string & {})
  containerName?: string
}

export type Properties = PropertiesFallback<Loose> & ContainerProperties

export type CssProperty = keyof Properties

type Pseudo = `&${SimplePseudos}`

export type CssProperties = Properties & {
  [key: string]: string | number | Record<string, any> | undefined
}

export type Keyframes = Record<string, { [time: string]: CssProperties }>

export type PandaConditionalValue<C extends Record<string, string>, V> =
  // NOTE: When using Clean<V>, it doesn't allow arbrtrary values. So I removed it.
  | V
  | {
      [Key in keyof C]?: PandaConditionalValue<C, V>
    }

type Union<Key extends string, CssProperties extends Record<Key, any>, UserProperties> = UserProperties extends {
  __type?: 'never'
}
  ? CssProperties[Key] | Loose
  : Key extends keyof UserProperties
  ? CssProperties[Key] | UserProperties[Key]
  : CssProperties[Key]

type Strict<
  Key extends string,
  CssProperties extends Record<Key, any>,
  UserProperties,
> = Key extends keyof UserProperties ? UserProperties[Key] : CssProperties[Key]

export type ConditionCssProperties<
  Conditions extends Record<string, string> = Record<string, string>,
  UserProperties extends Record<string, any> = { __type?: 'never' },
  StrictValue extends boolean = false,
> = {
  [Key in keyof Properties]?: PandaConditionalValue<
    Conditions,
    true extends StrictValue ? Strict<Key, Properties, UserProperties> : Union<Key, Properties, UserProperties>
  >
} & {
  [Key in keyof Omit<UserProperties, keyof Properties>]?: PandaConditionalValue<Conditions, UserProperties[Key]>
} & {
  [Key in keyof Conditions]?: ConditionCssProperties<Omit<Conditions, Key>, UserProperties, StrictValue>
}

export type WithNesting<T> = T & {
  selectors?: {
    [key in Pseudo | Loose]?: T
  }
  '@media'?: {
    [query: string]: T
  }
  '@container'?: {
    [query: string]: T
  }
}

export type PandaCssObject<
  Conditions extends Record<string, string>,
  UserProperties extends Record<string, any> = { __type?: 'never' },
  Strict extends boolean = false,
> = WithNesting<ConditionCssProperties<Conditions, UserProperties, Strict>>

export {}
