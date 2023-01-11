import { FunctionComponent } from 'react'
import { FlexProperties } from '../patterns/flex'
import { HTMLPandaProps } from '../types/jsx'

export type FlexProps = FlexProperties & Omit<HTMLPandaProps<'div'>, keyof FlexProperties | 'alignItems' | 'justifyContent' | 'flexDirection' | 'flexWrap' | 'flexShrink' | 'flexBasis'>


export declare const Flex: FunctionComponent<FlexProps>