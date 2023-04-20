import type { Token } from '../types/token'

export declare function token(path: Token, fallback?: string): string & {
  var: (path: Token, fallback?: string) => string
}