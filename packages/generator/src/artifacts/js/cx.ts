import outdent from 'outdent'
import type { Context } from '../../engines'

export function generateCx(ctx: Context) {
  return {
    js: outdent`
    ${ctx.file.import('cssCache, css, mergeCss', './css')}

    function cx() {
      const objs = []
      let str = '',
        i = 0,
        arg

      for (; i < arguments.length; ) {
        arg = arguments[i++]
        if (!arg || typeof arg !== 'string') continue

        if (cssCache.has(arg)) {
          objs.push(cssCache.get(arg))
          continue
        }

        str && (str += ' ')
        str += arg.toString()
      }

      const merged = mergeCss(...objs)
      return [css(merged), str].join(' ')
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
