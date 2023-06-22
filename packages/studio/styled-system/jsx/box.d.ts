/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BoxProperties } from '../patterns/box'
import type { HTMLPandaProps } from '../types/jsx'

export type BoxProps = BoxProperties & Omit<HTMLPandaProps<'div'>, keyof BoxProperties >


export declare const Box: FunctionComponent<BoxProps>