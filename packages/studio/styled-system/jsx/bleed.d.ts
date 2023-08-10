/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BleedProperties } from '../patterns/bleed'
import type { HTMLPandaProps } from '../types/jsx'

export type BleedProps = BleedProperties & Omit<HTMLPandaProps<'div'>, keyof BleedProperties >


export declare const Bleed: FunctionComponent<BleedProps>