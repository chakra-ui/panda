import { FunctionComponent } from 'react'
import { AbsoluteCenterProperties } from '../patterns/absolute-center'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type AbsoluteCenterProps = AbsoluteCenterProperties & Omit<HTMLPandaProps<'div'>, keyof AbsoluteCenterProperties >


export declare const AbsoluteCenter: FunctionComponent<AbsoluteCenterProps>