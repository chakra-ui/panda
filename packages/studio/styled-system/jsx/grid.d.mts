/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridProperties } from '../patterns/grid.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type GridProps = GridProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof GridProperties>

export declare const Grid: FunctionComponent<GridProps>
