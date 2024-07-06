/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FlexProperties } from '../patterns/flex';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface FlexProps extends FlexProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof FlexProperties > {}


export declare const Flex: FunctionComponent<FlexProps>