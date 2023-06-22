/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type LinkOverlayProperties = {
   
}


type LinkOverlayOptions = LinkOverlayProperties & Omit<SystemStyleObject, keyof LinkOverlayProperties >


export declare function linkOverlay(options?: LinkOverlayOptions): string
