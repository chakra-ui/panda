import { FunctionComponent } from 'react'
import { CircleProperties } from '../patterns/circle'
import { HTMLPandaProps } from '../types/jsx'

export type CircleProps = CircleProperties & Omit<HTMLPandaProps<'div'>, keyof CircleProperties >


export declare const Circle: FunctionComponent<CircleProps>