import outdent from 'outdent'

export function generateCx() {
  return {
    js: outdent`
      var cx = (...args) => {
        return Array.isArray(args[0]) ? clsx(...args[0]) : clsx(...args);
      }
  
      export { cx }
  `,
    dts: outdent`
       export declare function cx(...args: Values | Values[]): string;
      `,
  }
}
