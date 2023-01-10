import { FunctionComponent } from 'react'
import { HstackProperties } from '../patterns/hstack'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type HstackProps = HstackProperties & Omit<HTMLPandaProps<'div'>, keyof HstackProperties >


export declare const HStack: FunctionComponent<HstackProps>