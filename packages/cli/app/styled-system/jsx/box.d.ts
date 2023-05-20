import type { FunctionComponent } from 'react'
import type { BoxProperties } from '../patterns/box'
import type { HTMLStyledProps } from '../types/jsx'

export type BoxProps = BoxProperties & Omit<HTMLStyledProps<'div'>, keyof BoxProperties >


export declare const Box: FunctionComponent<BoxProps>