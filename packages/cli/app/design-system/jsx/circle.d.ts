import { FunctionComponent } from 'react'
import { CircleProperties } from '../patterns/circle'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type CircleProps = CircleProperties & Omit<HTMLPandaProps<'div'>, keyof CircleProperties >


export declare const Circle: FunctionComponent<CircleProps>