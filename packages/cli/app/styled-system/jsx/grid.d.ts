import type { FunctionComponent } from 'react'
import type { GridProperties } from '../patterns/grid'
import type { HTMLStyledProps } from '../types/jsx'

export type GridProps = GridProperties & Omit<HTMLStyledProps<'div'>, keyof GridProperties >


export declare const Grid: FunctionComponent<GridProps>