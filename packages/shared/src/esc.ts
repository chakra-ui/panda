const escapeRegExp = /(^[^_a-zA-Z\u00a0-\uffff]|[^-_a-zA-Z0-9\u00a0-\uffff])/g
export function esc(str: string) {
  //@ts-ignore
  return ''.replace.call(str, escapeRegExp, '\\$1')
}
