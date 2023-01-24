import type { Token } from '../types/token'
export declare function token(path: Token): string & { var: (path: Token) => string }