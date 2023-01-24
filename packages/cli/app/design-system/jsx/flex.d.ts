import type { FunctionComponent } from 'react'
import type { FlexProperties } from '../patterns/flex'
import type { HTMLPandaProps } from '../types/jsx'

export type FlexProps = FlexProperties & Omit<HTMLPandaProps<'div'>, keyof FlexProperties | 'alignItems' | 'justifyContent' | 'flexDirection' | 'flexDir' | 'flexWrap' | 'flexShrink' | 'flexBasis' | 'flexGrow' | 'flexFlow'>


export declare const Flex: FunctionComponent<FlexProps>