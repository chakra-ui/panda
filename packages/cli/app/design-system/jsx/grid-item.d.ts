import { FunctionComponent } from 'react'
import { GridItemProperties } from '../patterns/grid-item'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type GridItemProps = GridItemProperties & Omit<HTMLPandaProps<'div'>, keyof GridItemProperties >


export declare const GridItem: FunctionComponent<GridItemProps>