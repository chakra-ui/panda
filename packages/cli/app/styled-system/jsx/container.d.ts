import type { FunctionComponent } from 'react'
import type { ContainerProperties } from '../patterns/container'
import type { HTMLStyledProps } from '../types/jsx'

export type ContainerProps = ContainerProperties & Omit<HTMLStyledProps<'div'>, keyof ContainerProperties >


export declare const Container: FunctionComponent<ContainerProps>