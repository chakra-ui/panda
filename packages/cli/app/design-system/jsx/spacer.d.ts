import { FunctionComponent } from 'react'
import { SpacerProperties } from '../patterns/spacer'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type SpacerProps = SpacerProperties & Omit<HTMLPandaProps<'div'>, keyof SpacerProperties >


export declare const Spacer: FunctionComponent<SpacerProps>