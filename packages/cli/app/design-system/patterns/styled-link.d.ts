import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/token'

export type StyledLinkProperties = {
   
}

        
type StyledLinkOptions = StyledLinkProperties & Omit<SystemStyleObject, keyof StyledLinkProperties >


export declare function styledLink(options: StyledLinkOptions): string
