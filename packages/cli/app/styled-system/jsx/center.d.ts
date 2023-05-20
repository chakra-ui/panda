import type { FunctionComponent } from 'react'
import type { CenterProperties } from '../patterns/center'
import type { HTMLStyledProps } from '../types/jsx'

export type CenterProps = CenterProperties & Omit<HTMLStyledProps<'div'>, keyof CenterProperties >


export declare const Center: FunctionComponent<CenterProps>