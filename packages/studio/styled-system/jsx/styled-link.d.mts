/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { StyledLinkProperties } from '../patterns/styled-link.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type StyledLinkProps = StyledLinkProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof StyledLinkProperties>

export declare const StyledLink: FunctionComponent<StyledLinkProps>
