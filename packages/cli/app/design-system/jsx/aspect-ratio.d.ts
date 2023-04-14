import type { FunctionComponent } from 'react'
import type { AspectRatioProperties } from '../patterns/aspect-ratio'
import type { HTMLPandaProps } from '../types/jsx'

export type AspectRatioProps = AspectRatioProperties & Omit<HTMLPandaProps<'div'>, keyof AspectRatioProperties | 'aspectRatio'>


export declare const AspectRatio: FunctionComponent<AspectRatioProps>