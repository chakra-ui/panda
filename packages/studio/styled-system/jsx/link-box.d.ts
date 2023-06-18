/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { LinkBoxProperties } from '../patterns/link-box'
import type { HTMLPandaProps } from '../types/jsx'

export type LinkBoxProps = LinkBoxProperties & Omit<HTMLPandaProps<'div'>, keyof LinkBoxProperties >


export declare const LinkBox: FunctionComponent<LinkBoxProps>