/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SquareProperties } from '../patterns/square'
import type { HTMLPandaProps } from '../types/jsx'

export type SquareProps = SquareProperties & Omit<HTMLPandaProps<'div'>, keyof SquareProperties >


export declare const Square: FunctionComponent<SquareProps>