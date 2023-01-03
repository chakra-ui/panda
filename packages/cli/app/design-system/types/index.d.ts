import * as System from './system-types'
import { PropTypes } from './prop-type'
import { Conditions } from './conditions'

export type SystemStyleObject<Overrides = {}> = System.StyleObject<Conditions, PropTypes, false, Overrides>
export type GlobalStyleObject<Overrides = {}> = System.GlobalStyleObject<Conditions, PropTypes, false, Overrides>
export type JsxStyleProps<Overrides = {}> = System.JsxStyleProps<Conditions, PropTypes, false, Overrides>
export type ConditionalValue<Value> = System.Conditional<Conditions, Value>

type DistributiveOmit<T, U> = T extends any ? Pick<T, Exclude<keyof T, U>> : never
export type Assign<Target, Override> = DistributiveOmit<Target, keyof Override> & Override