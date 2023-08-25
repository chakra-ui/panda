/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SquareProperties } from '../patterns/square.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type SquareProps = SquareProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof SquareProperties>

export declare const Square: FunctionComponent<SquareProps>
