import outdent from 'outdent'

export function generateCx() {
  return {
    js: outdent`
    function cx() {
      let str = '',
        i = 0,
        arg

      for (; i < arguments.length; ) {
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

       /** Conditionally join classNames into a single string */
       export declare function cx(...args: Argument[]): string
      `,
  }
}
