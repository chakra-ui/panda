import type { FunctionComponent } from 'react'
import type { IndicatorProperties } from '../patterns/indicator'
import type { HTMLStyledProps } from '../types/jsx'

export type IndicatorProps = IndicatorProperties & Omit<HTMLStyledProps<'div'>, keyof IndicatorProperties >


export declare const Indicator: FunctionComponent<IndicatorProps>