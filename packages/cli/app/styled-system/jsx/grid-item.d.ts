import type { FunctionComponent } from 'react'
import type { GridItemProperties } from '../patterns/grid-item'
import type { HTMLStyledProps } from '../types/jsx'

export type GridItemProps = GridItemProperties & Omit<HTMLStyledProps<'div'>, keyof GridItemProperties >


export declare const GridItem: FunctionComponent<GridItemProps>