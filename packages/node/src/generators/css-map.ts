import { outdent } from 'outdent'

export function generateCssMap() {
  return {
    js: outdent`
    import { css } from "./css"
    
    export function cssMap(obj){
      return (...args) => {
        const finalCss = args.reduce((acc, arg) => {
            Object.assign(acc, obj[arg]);
            return acc;
        }, {})
        return css(finalCss);
      }
    }
    `,
    dts: outdent`
    import { SystemStyleObject } from "../types"
    
    export declare function cssMap<T extends string>(obj: Record<T, SystemStyleObject>): (...args: Array<T>) => string;
    `,
  }
}
