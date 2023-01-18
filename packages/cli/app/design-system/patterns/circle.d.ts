import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type CircleProperties = {
   size?: PropertyValue<'width'>
}

        
type CircleOptions = CircleProperties & Omit<SystemStyleObject, keyof CircleProperties >


export declare function circle(options: CircleOptions): string
