import { FunctionComponent } from 'react'
import { WrapProperties } from '../patterns/wrap'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type WrapProps = WrapProperties & Omit<HTMLPandaProps<'div'>, keyof WrapProperties >


export declare const Wrap: FunctionComponent<WrapProps>