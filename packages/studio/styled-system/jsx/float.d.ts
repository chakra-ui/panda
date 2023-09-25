/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FloatProperties } from '../patterns/float';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/helpers';

export interface FloatProps extends FloatProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof FloatProperties > {}


export declare const Float: FunctionComponent<FloatProps>