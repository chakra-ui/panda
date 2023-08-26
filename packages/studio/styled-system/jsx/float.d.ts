/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FloatProperties } from '../patterns/float'
import type { HTMLPandaProps } from '../types/jsx'
import type { DistributiveOmit } from '../types/system-types'

export type FloatProps = FloatProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof FloatProperties >


export declare const Float: FunctionComponent<FloatProps>