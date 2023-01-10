import { FunctionComponent } from 'react'
import { VstackProperties } from '../patterns/vstack'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type VstackProps = VstackProperties & Omit<HTMLPandaProps<'div'>, keyof VstackProperties >


export declare const VStack: FunctionComponent<VstackProps>