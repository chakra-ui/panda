import * as System from './system-types'
import { PropTypes } from './prop-type'
import { Conditions } from './conditions'

export type SystemStyleObject<Overrides extends Record<string, unknown> = {}> = System.StyleObject<Conditions, PropTypes, false, Overrides>

export type GlobalStyleObject<Overrides extends Record<string, unknown> = {}> = System.GlobalStyleObject<Conditions, PropTypes, false, Overrides>

export type JsxStyleProps<Overrides extends Record<string, unknown> = {}> = System.JsxStyleProps<Conditions, PropTypes, false, Overrides>

export type ConditionalValue<Value> = System.Conditional<Conditions, Value>

type DistributiveOmit<T, U> = T extends any ? Pick<T, Exclude<keyof T, U>> : never

export type Assign<Target, Override> = DistributiveOmit<Target, keyof Override> & Override