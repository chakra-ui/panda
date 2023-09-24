/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SquareProperties } from '../patterns/square';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface SquareProps extends SquareProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof SquareProperties > {}


export declare const Square: FunctionComponent<SquareProps>