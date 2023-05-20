import type { FunctionComponent } from 'react'
import type { StyledLinkProperties } from '../patterns/styled-link'
import type { HTMLStyledProps } from '../types/jsx'

export type StyledLinkProps = StyledLinkProperties & Omit<HTMLStyledProps<'div'>, keyof StyledLinkProperties >


export declare const StyledLink: FunctionComponent<StyledLinkProps>