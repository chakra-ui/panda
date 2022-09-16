import type { Properties } from './panda-csstype'

type ClassNameFn = (value: string, prop: string) => string

export type PropertyClassName = string | ClassNameFn

type ValuesFn = (token: (path: string) => any) => Record<string, string>

type CssObject =
  | Properties
  | {
      [selector: string]: string | number | null | undefined | Properties
    }

export type PropertyValues = string | string[] | Record<string, string> | ValuesFn

export type PropertyConfig = {
  /**
   * The classname this property will generate.
   */
  className: PropertyClassName
  /**
   * The css style object this property will generate.
   */
  transform?: (value: string) => CssObject
  /**
   * The possible values this property can have.
   */
  values?: string | string[] | { type: string } | Record<string, string> | ValuesFn
  /**
   * The css property this utility maps to.
   */
  cssType?: keyof Properties
  /**
   * [Experimental] The conditions this property can be used in.
   * Useful for initial class generation.
   */
  conditions?: string[]
}

export type UtilityConfig = {
  [property in keyof Properties | (string & {})]?: string | PropertyConfig
}

export type PluginResult = {
  type: 'object' | 'named-object'
  name?: string
  data: Record<string, any>
}
