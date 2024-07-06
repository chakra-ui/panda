/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CqProperties } from '../patterns/cq';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface CqProps extends CqProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof CqProperties > {}


export declare const Cq: FunctionComponent<CqProps>