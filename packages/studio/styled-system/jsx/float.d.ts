import type { FunctionComponent } from 'react'
import type { FloatProperties } from '../patterns/float'
import type { HTMLPandaProps } from '../types/jsx'

export type FloatProps = FloatProperties & Omit<HTMLPandaProps<'div'>, keyof FloatProperties >


export declare const Float: FunctionComponent<FloatProps>