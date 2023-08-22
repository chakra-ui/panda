/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridItemProperties } from '../patterns/grid-item'
import type { HTMLPandaProps } from '../types/jsx'
import type { DistributiveOmit } from '../types/system-types'

export type GridItemProps = GridItemProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof GridItemProperties >


export declare const GridItem: FunctionComponent<GridItemProps>