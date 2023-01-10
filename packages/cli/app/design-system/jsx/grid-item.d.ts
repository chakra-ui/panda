import { FunctionComponent } from 'react'
import { GridItemProperties } from '../patterns/grid-item'
import { HTMLPandaProps } from '../types/jsx'

export type GridItemProps = GridItemProperties & Omit<HTMLPandaProps<'div'>, keyof GridItemProperties >


export declare const GridItem: FunctionComponent<GridItemProps>