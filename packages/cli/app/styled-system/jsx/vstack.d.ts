import type { FunctionComponent } from 'react'
import type { VstackProperties } from '../patterns/vstack'
import type { HTMLPandaProps } from '../types/jsx'

export type VstackProps = VstackProperties & Omit<HTMLPandaProps<'div'>, keyof VstackProperties >


export declare const VStack: FunctionComponent<VstackProps>