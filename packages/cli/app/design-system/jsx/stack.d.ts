import { FunctionComponent } from 'react'
import { StackProperties } from '../patterns/stack'
import { HTMLPandaProps } from '../types/jsx'

export type StackProps = StackProperties & Omit<HTMLPandaProps<'div'>, keyof StackProperties >


export declare const Stack: FunctionComponent<StackProps>