/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { HstackProperties } from '../patterns/hstack';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export type HstackProps = HstackProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof HstackProperties >


export declare const HStack: FunctionComponent<HstackProps>