import { FunctionComponent } from 'react'
import { GridProperties } from '../patterns/grid'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type GridProps = GridProperties & Omit<HTMLPandaProps<'div'>, keyof GridProperties >


export declare const Grid: FunctionComponent<GridProps>