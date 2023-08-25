/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CircleProperties } from '../patterns/circle.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type CircleProps = CircleProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof CircleProperties>

export declare const Circle: FunctionComponent<CircleProps>
