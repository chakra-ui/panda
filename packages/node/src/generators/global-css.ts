import { outdent } from 'outdent'

export function generateGlobalCss() {
  return {
    js: outdent`
     export function globalCss(styles){
        void styles
     }
    `,
    dts: outdent`
    import { GlobalStyleObject } from '../types'

    export declare function globalCss(styles: GlobalStyleObject): void
    `,
  }
}
