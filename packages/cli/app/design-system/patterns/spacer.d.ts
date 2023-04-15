import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/token'

export type SpacerProperties = {
   size?: ConditionalValue<Tokens["spacing"]>
}

        
type SpacerOptions = SpacerProperties & Omit<SystemStyleObject, keyof SpacerProperties >


export declare function spacer(options?: SpacerOptions): string
