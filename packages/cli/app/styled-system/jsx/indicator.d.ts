import type { FunctionComponent } from 'react'
import type { IndicatorProperties } from '../patterns/indicator'
import type { HTMLPandaProps } from '../types/jsx'

export type IndicatorProps = IndicatorProperties & Omit<HTMLPandaProps<'div'>, keyof IndicatorProperties >


export declare const Indicator: FunctionComponent<IndicatorProps>