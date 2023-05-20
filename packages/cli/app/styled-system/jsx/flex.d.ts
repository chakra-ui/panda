import type { FunctionComponent } from 'react'
import type { FlexProperties } from '../patterns/flex'
import type { HTMLStyledProps } from '../types/jsx'

export type FlexProps = FlexProperties & Omit<HTMLStyledProps<'div'>, keyof FlexProperties >


export declare const Flex: FunctionComponent<FlexProps>