/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { DividerProperties } from '../patterns/divider';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export type DividerProps = DividerProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof DividerProperties >


export declare const Divider: FunctionComponent<DividerProps>