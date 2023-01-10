import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type SpacerProperties = {
   size?: ConditionalValue<Tokens["spacing"]>
}


type SpacerOptions = SpacerProperties & Omit<SystemStyleObject, keyof SpacerProperties >


export declare function spacer(options: SpacerOptions): string
