import { FunctionComponent } from 'react'
import { StackProperties } from '../patterns/stack'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type StackProps = StackProperties & Omit<HTMLPandaProps<'div'>, keyof StackProperties >


export declare const Stack: FunctionComponent<StackProps>