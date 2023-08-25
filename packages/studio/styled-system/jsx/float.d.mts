/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FloatProperties } from '../patterns/float.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type FloatProps = FloatProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof FloatProperties>

export declare const Float: FunctionComponent<FloatProps>
