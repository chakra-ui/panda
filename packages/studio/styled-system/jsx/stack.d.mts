/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { StackProperties } from '../patterns/stack.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type StackProps = StackProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof StackProperties>

export declare const Stack: FunctionComponent<StackProps>
