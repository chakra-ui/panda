import { outdent } from 'outdent'

export function generateDts() {
  return outdent`
  import { Token } from "../types/token"
  export declare function getToken(path: Token): string
  export declare function getTokenVar(path: Token): string
  `
}
