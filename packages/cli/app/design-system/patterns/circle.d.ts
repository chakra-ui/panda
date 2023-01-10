import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type CircleProperties = {
   size?: ConditionalValue<Tokens["sizes"]>
}


type CircleOptions = CircleProperties & Omit<SystemStyleObject, keyof CircleProperties >


export declare function circle(options: CircleOptions): string
