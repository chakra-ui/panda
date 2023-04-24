import type { FunctionComponent } from 'react'
import type { HstackProperties } from '../patterns/hstack'
import type { HTMLPandaProps } from '../types/jsx'

export type HstackProps = HstackProperties & Omit<HTMLPandaProps<'div'>, keyof HstackProperties | 'flexDirection'>


export declare const HStack: FunctionComponent<HstackProps>