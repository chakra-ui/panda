import { AtRule } from '../types/csstype'

type RequiredBy<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<Pick<T, K>>

export type FontFaceRule = RequiredBy<AtRule.FontFaceFallback, 'src'>

export declare function fontFace(name: string, rule: FontFaceRule): void
