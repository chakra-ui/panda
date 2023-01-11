import { FunctionComponent } from 'react'
import { FlexProperties } from '../patterns/flex'
import { HTMLPandaProps } from '../types/jsx'

export type FlexProps = FlexProperties & Omit<HTMLPandaProps<'div'>, keyof FlexProperties | 'alignItems' | 'justifyContent' | 'flexDirection' | 'flexDir' | 'flexWrap' | 'flexShrink' | 'flexBasis' | 'flexGrow' | 'flexFlow'>


export declare const Flex: FunctionComponent<FlexProps>