/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { DividerProperties } from '../patterns/divider.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type DividerProps = DividerProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof DividerProperties>

export declare const Divider: FunctionComponent<DividerProps>
