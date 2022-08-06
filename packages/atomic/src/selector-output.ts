import { esc } from './shared'

export function concat<T>(values: T[], value: T) {
  if (Boolean(value)) values.push(value)
}

export class SelectorOutput {
  before: string[] = []
  after: string[] = []
  between: string = ''

  constructor(initial: string) {
    this.between = initial
    return this
  }

  pseudoSelector(selector: string): SelectorOutput {
    const after = selector.replace(/^&/, '')
    concat(this.after, after)
    return this
  }

  parentSelector(selector: string): SelectorOutput {
    const [before = '', after = ''] = selector.split('&').map((t) => t.trim())
    concat(this.before, before)
    concat(this.after, after)
    return this
  }

  get selector() {
    const { before, after, between } = this
    const _this = `.${esc(between)}${after.join('')}`
    const _before = before.join(' ')
    return _before.includes('this') ? _before.replace('this', _this) : `${_before} ${_this}`
  }
}
