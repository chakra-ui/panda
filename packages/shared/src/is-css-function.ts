const fns = ['min', 'max', 'clamp', 'calc']
const fnRegExp = new RegExp(`^(${fns.join('|')})\\(.*\\)`)

export const isCssFunction = (v: unknown) => typeof v === 'string' && fnRegExp.test(v)
