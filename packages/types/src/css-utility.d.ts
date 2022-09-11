import type { Properties } from './panda-csstype'

type ClassNameFn = (value: string, prop: string) => string

export type PropertyClassName = string | ClassNameFn

type ValuesFn = (token: (path: string) => any) => Record<string, string>

type CssObject =
  | Properties
  | {
      [selector: string]: string | number | null | undefined | Properties
    }

export type PropertyUtility<T extends Record<string, any>> = {
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
  values?: keyof T | string[] | Record<string, string> | ValuesFn
  /**
   * The css property this utility maps to.
   */
  cssType?: keyof Properties
  /**
   * Custom TS type for this property.
   */
  valueType?: string
  /**
   * [Experimental] The conditions this property can be used in.
   * Useful for initial class generation.
   */
  conditions?: string[]
}

export type Utility<T extends Record<string, any> = Record<string, any>> = {
  /**
   * The css properties matched by this utility.
   */
  properties: {
    [property in keyof Properties | (string & Record<never, never>)]?: string | PropertyUtility<T>
  }

  /**
   * Shortcuts for the defined properties.
   * e.g. `p` for `padding`
   */
  shorthands?: {
    [shorthand: string]: string
  }
}

export type PluginResult = {
  type: 'object' | 'named-object'
  name?: string
  data: Record<string, any>
}
