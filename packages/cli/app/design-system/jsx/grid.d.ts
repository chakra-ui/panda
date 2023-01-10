import { FunctionComponent } from 'react'
import { GridProperties } from '../patterns/grid'
import { HTMLPandaProps } from '../types/jsx'

export type GridProps = GridProperties & Omit<HTMLPandaProps<'div'>, keyof GridProperties >


export declare const Grid: FunctionComponent<GridProps>