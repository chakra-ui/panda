import type { Properties } from './panda-csstype'

type ClassNameFn = (value: string, prop: string) => string

export type PropertyClassName = string | ClassNameFn

type Getter = (path: string) => any

type ThemeFn = (token: Getter) => Record<string, string>

type CssObject =
  | Properties
  | {
      [selector: string]: string | number | null | undefined | Properties
    }

export type PropertyValues = string | string[] | { type: string } | Record<string, string> | ThemeFn

export type PropertyTransform<T = CssObject> = (value: any, token: Getter) => T

export type PropertyConfig = {
  /**
   * @internal
   * The cascade layer to which the property  belongs
   */
  layer?: string
  /**
   * The classname this property will generate.
   */
  className?: string
  /**
   * The css style object this property will generate.
   */
  transform?: PropertyTransform
  /**
   * The possible values this property can have.
   */
  values?: PropertyValues
  /**
   * The css property this utility maps to.
   */
  property?: keyof Properties
  /**
   * The shorthand of the property.
   */
  shorthand?: string
}

export type UtilityConfig = {
  [property in keyof Properties]?: PropertyConfig
} & {
  [key: string]: PropertyConfig
}
