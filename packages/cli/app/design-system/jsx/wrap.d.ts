import { FunctionComponent } from 'react'
import { WrapProperties } from '../patterns/wrap'
import { HTMLPandaProps } from '../types/jsx'

export type WrapProps = WrapProperties & Omit<HTMLPandaProps<'div'>, keyof WrapProperties >


export declare const Wrap: FunctionComponent<WrapProps>