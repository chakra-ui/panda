/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { StyledLinkProperties } from '../patterns/styled-link';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export type StyledLinkProps = StyledLinkProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof StyledLinkProperties >


export declare const StyledLink: FunctionComponent<StyledLinkProps>