import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/tokens'

export type ContainerProperties = {
   size?: ConditionalValue<Tokens["breakpoints"]>
}


type ContainerOptions = ContainerProperties & Omit<SystemStyleObject, keyof ContainerProperties >


export declare function container(options?: ContainerOptions): string
