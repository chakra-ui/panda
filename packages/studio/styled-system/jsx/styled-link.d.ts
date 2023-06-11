import type { FunctionComponent } from 'react'
import type { StyledLinkProperties } from '../patterns/styled-link'
import type { HTMLPandaProps } from '../types/jsx'

export type StyledLinkProps = StyledLinkProperties & Omit<HTMLPandaProps<'div'>, keyof StyledLinkProperties >


export declare const StyledLink: FunctionComponent<StyledLinkProps>