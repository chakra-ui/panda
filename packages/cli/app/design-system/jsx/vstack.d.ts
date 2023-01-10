import { FunctionComponent } from 'react'
import { VstackProperties } from '../patterns/vstack'
import { HTMLPandaProps } from '../types/jsx'

export type VstackProps = VstackProperties & Omit<HTMLPandaProps<'div'>, keyof VstackProperties >


export declare const VStack: FunctionComponent<VstackProps>