/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridItemProperties } from '../patterns/grid-item'
import type { HTMLPandaProps } from '../types/jsx'

export type GridItemProps = GridItemProperties & Omit<HTMLPandaProps<'div'>, keyof GridItemProperties >


export declare const GridItem: FunctionComponent<GridItemProps>