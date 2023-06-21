import type { FunctionComponent } from 'react'
import type { DividerProperties } from '../patterns/divider'
import type { HTMLPandaProps } from '../types/jsx'

export type DividerProps = DividerProperties & Omit<HTMLPandaProps<'div'>, keyof DividerProperties >


export declare const Divider: FunctionComponent<DividerProps>