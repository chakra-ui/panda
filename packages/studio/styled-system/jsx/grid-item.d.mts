/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridItemProperties } from '../patterns/grid-item.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type GridItemProps = GridItemProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof GridItemProperties>

export declare const GridItem: FunctionComponent<GridItemProps>
