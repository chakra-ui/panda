/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { VisuallyHiddenProperties } from '../patterns/visually-hidden.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type VisuallyHiddenProps = VisuallyHiddenProperties &
  DistributiveOmit<HTMLPandaProps<'div'>, keyof VisuallyHiddenProperties>

export declare const VisuallyHidden: FunctionComponent<VisuallyHiddenProps>
