import type { FunctionComponent } from 'react'
import type { JoinProperties } from '../patterns/join'
import type { HTMLPandaProps } from '../types/jsx'

export type JoinProps = JoinProperties & Omit<HTMLPandaProps<'div'>, keyof JoinProperties >


export declare const Join: FunctionComponent<JoinProps>