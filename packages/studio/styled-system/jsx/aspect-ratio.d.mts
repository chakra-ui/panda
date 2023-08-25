/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { AspectRatioProperties } from '../patterns/aspect-ratio.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type AspectRatioProps = AspectRatioProperties &
  DistributiveOmit<HTMLPandaProps<'div'>, keyof AspectRatioProperties | 'aspectRatio'>

export declare const AspectRatio: FunctionComponent<AspectRatioProps>
