/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridProperties } from '../patterns/grid';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export type GridProps = GridProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof GridProperties >


export declare const Grid: FunctionComponent<GridProps>