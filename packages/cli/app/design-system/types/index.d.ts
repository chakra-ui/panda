import './global'
export { ConditionalValue } from './conditions'
export { GlobalStyleObject, JsxStyleProps, SystemStyleObject } from './system-types'

export type Assign<Target, Override> = Omit<Target, keyof Override> & Override