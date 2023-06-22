/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FlexProperties } from '../patterns/flex'
import type { HTMLPandaProps } from '../types/jsx'

export type FlexProps = FlexProperties & Omit<HTMLPandaProps<'div'>, keyof FlexProperties >


export declare const Flex: FunctionComponent<FlexProps>