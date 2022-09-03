import { CssObject, ConditionalValue } from './panda-csstype'
import { PropertyTypes } from './property-type'
import { Conditions } from './conditions'

export type UserCssObject = CssObject<Conditions, PropertyTypes>
export type UserConditionalValue<V> = ConditionalValue<Conditions, V>