/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { StackProperties } from '../patterns/stack'
import type { HTMLPandaProps } from '../types/jsx'

export type StackProps = StackProperties & Omit<HTMLPandaProps<'div'>, keyof StackProperties >


export declare const Stack: FunctionComponent<StackProps>