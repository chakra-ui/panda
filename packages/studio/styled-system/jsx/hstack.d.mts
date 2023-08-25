/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { HstackProperties } from '../patterns/hstack.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type HstackProps = HstackProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof HstackProperties>

export declare const HStack: FunctionComponent<HstackProps>
