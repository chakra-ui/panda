import { outdent } from 'outdent'

export function generateGlobalCss() {
  return {
    js: outdent`
     export function globalCss(styles){
        void styles
     }
    `,
    dts: outdent`
    import { Properties } from '../types/csstype'
    
    export type GlobalCss = Record<string, Properties>
    
    export declare function globalCss(styles: GlobalCss): void;
    `,
  }
}
