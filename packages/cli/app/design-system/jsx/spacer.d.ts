import { FunctionComponent } from 'react'
import { SpacerProperties } from '../patterns/spacer'
import { HTMLPandaProps } from '../types/jsx'

export type SpacerProps = SpacerProperties & Omit<HTMLPandaProps<'div'>, keyof SpacerProperties >


export declare const Spacer: FunctionComponent<SpacerProps>