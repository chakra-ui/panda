import type { Token } from '../types/tokens'

export declare const token: {
  (path: Token, fallback?: string): string
  var: (path: Token, fallback?: string) => string
}