import { FunctionComponent } from 'react'
import { HstackProperties } from '../patterns/hstack'
import { HTMLPandaProps } from '../types/jsx'

export type HstackProps = HstackProperties & Omit<HTMLPandaProps<'div'>, keyof HstackProperties >


export declare const HStack: FunctionComponent<HstackProps>