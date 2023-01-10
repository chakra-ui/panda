import { FunctionComponent } from 'react'
import { ContainerProperties } from '../patterns/container'
import { PandaComponent, HTMLPandaProps } from '../types/jsx'
import { Assign } from '../types'

export type ContainerProps = ContainerProperties & Omit<HTMLPandaProps<'div'>, keyof ContainerProperties >


export declare const Container: FunctionComponent<ContainerProps>