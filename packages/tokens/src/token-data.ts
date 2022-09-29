import { cssVar } from '@css-panda/shared'
import { negate } from './calc'

type Data = {
  category: string
  entry: Entry | Readonly<Entry>
}

type Options = { negative?: boolean; prefix?: string }

type Entry = [key: string, value: string]

export class TokenData {
  /**
   * The internal value
   */
  value: string

  constructor(private data: Data | Readonly<Data>, private options: Options = {}) {
    this.value = this.getValue()
  }

  /**
   * The category of the token (e.g 'colors')
   */
  public get category(): string {
    return this.data.category
  }

  /**
   * Whether the token represents a negative value
   */
  public get negative() {
    return !!this.options.negative
  }

  /**
   * The name of the token (e.g green.500)
   */
  public get key() {
    const [key] = this.data.entry
    return this.negative ? `-${key}` : key
  }

  /**
   * The css variable represeatation of the token
   */
  private get variable() {
    const [key] = this.data.entry
    return cssVar(key, {
      prefix: [this.options.prefix, this.category].filter(Boolean).join('-'),
    })
  }

  /**
   * The string composed of the category and token name (e.g 'colors.green.500')
   */
  public get prop(): string {
    const [key] = this.data.entry
    return this.negative ? `${this.category}.-${key}` : `${this.category}.${key}`
  }

  /**
   * The value of the token (e.g '#00ff00').
   * If the token is a semantic token, value will be the variable ref
   */
  private getValue(): string {
    const [, value] = this.data.entry
    return this.negative ? negate(value) : value
  }

  /**
   * The variable reference of the token (e.g 'var(--colors-green-500)')
   */
  public get varRef(): string {
    const { negative, variable } = this
    return negative ? negate(variable.ref) : variable.ref
  }

  /**
   * The variable name of the token (e.g '--colors-green-500')
   */
  public get var(): `--${string}` {
    return this.variable.var
  }

  toJSON() {
    return {
      category: this.category,
      key: this.key,
      prop: this.prop,
      value: this.value,
      var: this.var,
      varRef: this.varRef,
      negative: this.negative,
    }
  }
}
