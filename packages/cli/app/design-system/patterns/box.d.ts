import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type BoxProperties = {
   
}

        
type BoxOptions = BoxProperties & Omit<SystemStyleObject, keyof BoxProperties >


export declare function box(options: BoxOptions): string
