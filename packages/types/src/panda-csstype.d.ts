import type { PropertiesFallback, SimplePseudos } from './csstype'

type Loose<T = string> = T & { __type?: never }

type ContainerProperties = {
  container?: string
  containerType?: 'size' | 'inline-size' | Loose
  containerName?: string
}

export type Properties = PropertiesFallback<Loose<string> | Loose<number>> & ContainerProperties

export type CssProperty = keyof Properties

type Pseudo = `&${SimplePseudos}`

export type CssProperties = Properties & {
  [property: string]: string | number | Record<string, any> | undefined
}

export type KeyframeDefinition = {
  [time: string]: CssProperties
}

export type Keyframes = {
  [keyframe: string]: {
    description?: string
    value: KeyframeDefinition
  }
}

type TCondition = Record<string, string>

export type PandaConditionalValue<Condition extends TCondition, Value> =
  | Value
  | {
      [Key in keyof Condition]?: PandaConditionalValue<Condition, Value>
    }

type NeverType = { __type?: 'never' }

type Union<
  Key extends string,
  CssProperties extends Record<Key, any>,
  UserProperties,
> = UserProperties extends NeverType
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
  Conditions extends TCondition = TCondition,
  UserProperties extends Record<string, any> = NeverType,
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

type NestedCss<T> = T & {
  [key in Pseudo | Loose]?: NestedCss<T> | Loose<string> | Loose<number> | boolean
}

export type GroupedCss<T> = {
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
  Conditions extends TCondition,
  UserProperties extends Record<string, any> = NeverType,
  Strict extends boolean = false,
> = NestedCss<ConditionCssProperties<Conditions, UserProperties, Strict>> &
  GroupedCss<ConditionCssProperties<Conditions, UserProperties, Strict>>

export type GlobalCss<
  Conditions extends TCondition,
  UserProperties extends Record<string, any> = NeverType,
  Strict extends boolean = false,
> = Record<string, NestedCss<ConditionCssProperties<Conditions, UserProperties, Strict>>>

export {}
