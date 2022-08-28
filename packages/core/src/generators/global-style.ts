export function generateGlobalStyle() {
  return {
    js: `
     export function globalStyle(styles){
        return void 0
     }
    `,
    dts: `
    import { Properties } from '../types/csstype'
    
    export type GlobalStyles = Record<string, Properties>
    
    export declare function globalStyle(styles: GlobalStyles): void;
    `,
  }
}
