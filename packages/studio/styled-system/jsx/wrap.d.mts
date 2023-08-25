/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { WrapProperties } from '../patterns/wrap.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type WrapProps = WrapProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof WrapProperties>

export declare const Wrap: FunctionComponent<WrapProps>
