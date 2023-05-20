import type { FunctionComponent } from 'react'
import type { DividerProperties } from '../patterns/divider'
import type { HTMLStyledProps } from '../types/jsx'

export type DividerProps = DividerProperties & Omit<HTMLStyledProps<'div'>, keyof DividerProperties >


export declare const Divider: FunctionComponent<DividerProps>