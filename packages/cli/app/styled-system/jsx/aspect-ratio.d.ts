import type { FunctionComponent } from 'react'
import type { AspectRatioProperties } from '../patterns/aspect-ratio'
import type { HTMLStyledProps } from '../types/jsx'

export type AspectRatioProps = AspectRatioProperties & Omit<HTMLStyledProps<'div'>, keyof AspectRatioProperties | 'aspectRatio'>


export declare const AspectRatio: FunctionComponent<AspectRatioProps>