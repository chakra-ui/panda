import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type SpacerProperties = {
   size?: ConditionalValue<Tokens["spacing"]>
}

        
type SpacerOptions = SpacerProperties & {
  [K in keyof Omit<SystemStyleObject, keyof SpacerProperties >]?: SystemStyleObject[K]
}


export declare function spacer(options: SpacerOptions): string
