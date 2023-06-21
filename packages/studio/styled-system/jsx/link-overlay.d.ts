import type { FunctionComponent } from 'react'
import type { LinkOverlayProperties } from '../patterns/link-overlay'
import type { HTMLPandaProps } from '../types/jsx'

export type LinkOverlayProps = LinkOverlayProperties & Omit<HTMLPandaProps<'a'>, keyof LinkOverlayProperties >


export declare const LinkOverlay: FunctionComponent<LinkOverlayProps>