/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FlexProperties } from '../patterns/flex.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type FlexProps = FlexProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof FlexProperties>

export declare const Flex: FunctionComponent<FlexProps>
