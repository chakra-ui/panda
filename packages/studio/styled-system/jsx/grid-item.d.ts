/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridItemProperties } from '../patterns/grid-item';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface GridItemProps extends GridItemProperties, DistributiveOmit<HTMLPandaProps<'div'>, keyof GridItemProperties > {}


export declare const GridItem: FunctionComponent<GridItemProps>