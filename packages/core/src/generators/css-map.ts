import { outdent } from 'outdent'

export function generateCssMap() {
  return {
    js: outdent`
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
    import { UserCssObject } from "./css"
    export declare function cssMap<T extends string>(obj: Record<T, UserCssObject>): (...args: Array<T>) => UserCssObject;
    `,
  }
}
