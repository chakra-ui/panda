import type { FunctionComponent } from 'react'
import type { CircleProperties } from '../patterns/circle'
import type { HTMLPandaProps } from '../types/jsx'

export type CircleProps = CircleProperties & Omit<HTMLPandaProps<'div'>, keyof CircleProperties | 'width' | 'height' | 'borderRadius'>


export declare const Circle: FunctionComponent<CircleProps>