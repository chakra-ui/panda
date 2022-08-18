import outdent from 'outdent'

export function generateCx() {
  return {
    js: outdent`
    function cx() {
      let str = '',
        i = 0,
        arg
    
      while (i < arguments.length) {
        if ((arg = arguments[i++]) && typeof arg === 'string') {
          str && (str += ' ')
          str += arg
        }
      }
      return str
    }
   
    export { cx }
  `,
    dts: outdent`
       type Argument = string | boolean | null | undefined
       export declare function cx(...args: Argument[]): string
      `,
  }
}
