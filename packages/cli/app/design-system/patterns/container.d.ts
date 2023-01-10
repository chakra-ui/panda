import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type ContainerProperties = {
   centerContent?: ConditionalValue<boolean>
}


type ContainerOptions = ContainerProperties & Omit<SystemStyleObject, keyof ContainerProperties >


export declare function container(options: ContainerOptions): string
