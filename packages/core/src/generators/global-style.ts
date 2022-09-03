import { outdent } from 'outdent'

export function generateGlobalStyle() {
  return {
    js: outdent`
     export function globalStyle(styles){
        return void styles
     }
    `,
    dts: outdent`
    import { Properties } from '../types/csstype'
    
    export type GlobalStyles = Record<string, Properties>
    
    export declare function globalStyle(styles: GlobalStyles): void;
    `,
  }
}
