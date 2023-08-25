/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { LinkBoxProperties } from '../patterns/link-box.d.mts'
import type { HTMLPandaProps } from '../types/jsx.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'

export type LinkBoxProps = LinkBoxProperties & DistributiveOmit<HTMLPandaProps<'div'>, keyof LinkBoxProperties>

export declare const LinkBox: FunctionComponent<LinkBoxProps>
