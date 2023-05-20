import type { FunctionComponent } from 'react'
import type { WrapProperties } from '../patterns/wrap'
import type { HTMLStyledProps } from '../types/jsx'

export type WrapProps = WrapProperties & Omit<HTMLStyledProps<'div'>, keyof WrapProperties >


export declare const Wrap: FunctionComponent<WrapProps>