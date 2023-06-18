/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridProperties } from '../patterns/grid'
import type { HTMLPandaProps } from '../types/jsx'

export type GridProps = GridProperties & Omit<HTMLPandaProps<'div'>, keyof GridProperties >


export declare const Grid: FunctionComponent<GridProps>