import { cssCache, css, mergeCss } from './css.mjs'

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
