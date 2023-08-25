/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BleedProperties } from '../patterns/bleed.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type BleedProps = BleedProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof BleedProperties>

export declare const Bleed: FunctionComponent<BleedProps>
