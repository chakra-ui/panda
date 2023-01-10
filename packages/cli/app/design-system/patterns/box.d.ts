import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type BoxProperties = {
   
}

        
type BoxOptions = BoxProperties & {
  [K in keyof Omit<SystemStyleObject, keyof BoxProperties >]?: SystemStyleObject[K]
}


export declare function box(options: BoxOptions): string
