/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { LinkOverlayProperties } from '../patterns/link-overlay.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type LinkOverlayProps = LinkOverlayProperties &
  DistributiveOmit<HTMLPandaProps<'a'>, keyof LinkOverlayProperties>

export declare const LinkOverlay: FunctionComponent<LinkOverlayProps>
