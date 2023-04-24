import type { FunctionComponent } from 'react'
import type { AbsoluteCenterProperties } from '../patterns/absolute-center'
import type { HTMLPandaProps } from '../types/jsx'

export type AbsoluteCenterProps = AbsoluteCenterProperties & Omit<HTMLPandaProps<'div'>, keyof AbsoluteCenterProperties >


export declare const AbsoluteCenter: FunctionComponent<AbsoluteCenterProps>