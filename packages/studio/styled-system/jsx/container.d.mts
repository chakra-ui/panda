/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { ContainerProperties } from '../patterns/container.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type ContainerProps = ContainerProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof ContainerProperties>

export declare const Container: FunctionComponent<ContainerProps>
