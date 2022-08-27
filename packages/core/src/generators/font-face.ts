import { outdent } from 'outdent'

export function generateFontFace() {
  return {
    js: outdent`
    export function fontFace(name, rule){
        return void 0;
    }
    `,
    dts: outdent`
    import { AtRule } from '../types/csstype'
    
    type RequiredBy<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<Pick<T, K>>
    
    export type FontFaceRule = RequiredBy<AtRule.FontFaceFallback, 'src'>
    
    export declare function fontFace(name: string, rule: FontFaceRule): void

    `,
  }
}
