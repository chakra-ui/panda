import { FunctionComponent } from 'react'
import { BoxProperties } from '../patterns/box'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type BoxProps = BoxProperties & Omit<HTMLPandaProps<'div'>, keyof BoxProperties >


export declare const Box: FunctionComponent<BoxProps>