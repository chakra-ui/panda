/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SpacerProperties } from '../patterns/spacer.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type SpacerProps = SpacerProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof SpacerProperties>

export declare const Spacer: FunctionComponent<SpacerProps>
