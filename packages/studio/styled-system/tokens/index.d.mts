/* eslint-disable */
import type { Token } from './tokens.d.mts'

export declare const token: {
  (path: Token, fallback?: string): string
  var: (path: Token, fallback?: string) => string
}

export type * from './tokens.d.mts'
