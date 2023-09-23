/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SpacerProperties } from '../patterns/spacer';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface SpacerProps extends SpacerProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof SpacerProperties > {}


export declare const Spacer: FunctionComponent<SpacerProps>