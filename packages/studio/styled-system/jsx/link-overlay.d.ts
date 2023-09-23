/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { LinkOverlayProperties } from '../patterns/link-overlay';
import type { HTMLPandaProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface LinkOverlayProps extends LinkOverlayProperties, DistributiveOmit<HTMLPandaProps<'a'>, keyof LinkOverlayProperties > {}


export declare const LinkOverlay: FunctionComponent<LinkOverlayProps>