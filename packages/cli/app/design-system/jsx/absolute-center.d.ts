import { FunctionComponent } from 'react'
import { AbsoluteCenterProperties } from '../patterns/absolute-center'
import { HTMLPandaProps } from '../types/jsx'

export type AbsoluteCenterProps = AbsoluteCenterProperties & Omit<HTMLPandaProps<'div'>, keyof AbsoluteCenterProperties >


export declare const AbsoluteCenter: FunctionComponent<AbsoluteCenterProps>