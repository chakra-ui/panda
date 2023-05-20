import type { FunctionComponent } from 'react'
import type { AbsoluteCenterProperties } from '../patterns/absolute-center'
import type { HTMLStyledProps } from '../types/jsx'

export type AbsoluteCenterProps = AbsoluteCenterProperties & Omit<HTMLStyledProps<'div'>, keyof AbsoluteCenterProperties >


export declare const AbsoluteCenter: FunctionComponent<AbsoluteCenterProps>