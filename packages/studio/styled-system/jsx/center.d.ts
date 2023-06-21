/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CenterProperties } from '../patterns/center'
import type { HTMLPandaProps } from '../types/jsx'

export type CenterProps = CenterProperties & Omit<HTMLPandaProps<'div'>, keyof CenterProperties >


export declare const Center: FunctionComponent<CenterProps>