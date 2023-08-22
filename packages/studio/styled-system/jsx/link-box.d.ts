/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { LinkBoxProperties } from '../patterns/link-box'
import type { HTMLPandaProps } from '../types/jsx'
import type { DistributiveOmit } from '../types/system-types'

export type LinkBoxProps = LinkBoxProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof LinkBoxProperties >


export declare const LinkBox: FunctionComponent<LinkBoxProps>