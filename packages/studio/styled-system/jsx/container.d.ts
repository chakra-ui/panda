/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { ContainerProperties } from '../patterns/container'
import type { HTMLPandaProps } from '../types/jsx'

export type ContainerProps = ContainerProperties & Omit<HTMLPandaProps<'div'>, keyof ContainerProperties >


export declare const Container: FunctionComponent<ContainerProps>