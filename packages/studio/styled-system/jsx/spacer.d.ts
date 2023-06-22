/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SpacerProperties } from '../patterns/spacer'
import type { HTMLPandaProps } from '../types/jsx'

export type SpacerProps = SpacerProperties & Omit<HTMLPandaProps<'div'>, keyof SpacerProperties >


export declare const Spacer: FunctionComponent<SpacerProps>