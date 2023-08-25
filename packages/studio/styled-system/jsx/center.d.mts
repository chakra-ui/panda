/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CenterProperties } from '../patterns/center.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type CenterProps = CenterProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof CenterProperties>

export declare const Center: FunctionComponent<CenterProps>
