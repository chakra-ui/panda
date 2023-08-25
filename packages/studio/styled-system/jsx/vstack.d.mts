/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { VstackProperties } from '../patterns/vstack.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type VstackProps = VstackProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof VstackProperties>

export declare const VStack: FunctionComponent<VstackProps>
