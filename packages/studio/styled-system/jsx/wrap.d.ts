/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { WrapProperties } from '../patterns/wrap'
import type { HTMLPandaProps } from '../types/jsx'

export type WrapProps = WrapProperties & Omit<HTMLPandaProps<'div'>, keyof WrapProperties >


export declare const Wrap: FunctionComponent<WrapProps>