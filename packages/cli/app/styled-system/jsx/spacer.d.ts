import type { FunctionComponent } from 'react'
import type { SpacerProperties } from '../patterns/spacer'
import type { HTMLStyledProps } from '../types/jsx'

export type SpacerProps = SpacerProperties & Omit<HTMLStyledProps<'div'>, keyof SpacerProperties >


export declare const Spacer: FunctionComponent<SpacerProps>