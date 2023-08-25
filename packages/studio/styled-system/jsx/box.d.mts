/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BoxProperties } from '../patterns/box.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type BoxProps = BoxProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof BoxProperties>

export declare const Box: FunctionComponent<BoxProps>
