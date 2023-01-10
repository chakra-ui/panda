import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type CircleProperties = {
   size?: ConditionalValue<Tokens["sizes"]>
}

        
type CircleOptions = CircleProperties & {
  [K in keyof Omit<SystemStyleObject, keyof CircleProperties >]?: SystemStyleObject[K]
}


export declare function circle(options: CircleOptions): string
