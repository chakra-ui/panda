import { FunctionComponent } from 'react'
import { BoxProperties } from '../patterns/box'
import { HTMLPandaProps } from '../types/jsx'

export type BoxProps = BoxProperties & Omit<HTMLPandaProps<'div'>, keyof BoxProperties >


export declare const Box: FunctionComponent<BoxProps>