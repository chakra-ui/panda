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