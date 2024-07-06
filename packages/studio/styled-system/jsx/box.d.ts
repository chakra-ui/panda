/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BoxProperties } from '../patterns/box';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface BoxProps extends BoxProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof BoxProperties > {}


export declare const Box: FunctionComponent<BoxProps>