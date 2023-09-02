/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CircleProperties } from '../patterns/circle';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export type CircleProps = CircleProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof CircleProperties >


export declare const Circle: FunctionComponent<CircleProps>