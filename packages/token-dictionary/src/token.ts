import { isBaseCondition, toHash, walkObject } from '@pandacss/shared'
import { isCompositeTokenValue } from './is-composite'
import { getReferences, hasReference } from './utils'

/**
 * The token data provided by the user
 */
export type TokenEntry<T = any> = {
  value: T
  description?: string
  type?: string
  extensions?: {
    [key: string]: any
  }
}

type TokenStatus = 'deprecated' | 'experimental' | 'new'

interface ExtensionData {
  status?: TokenStatus
  category?: string
  references?: TokenReferences
  condition?: string
  conditions?: TokenConditions
  theme?: string
}

interface TokenConditions {
  [key: string]: string
}

interface TokenReferences {
  [key: string]: Token
}

export type TokenExtensions<T = {}> = ExtensionData & {
  [key: string]: any
} & T

interface ExtendedToken {
  name: string
  value: any
  type?: string
  path?: string[]
  description?: string
  extensions?: TokenExtensions
}

/**
 * Represents a design token in the dictionary
 */
export class Token {
  name: string
  value: any
  originalValue: any
  path: string[]

  type?: string
  description?: string
  extensions: TokenExtensions

  constructor(data: ExtendedToken) {
    this.name = data.name

    this.value = data.value
    this.originalValue = data.value

    this.path = data.path ?? []

    if (data.type) {
      this.type = data.type
    }

    if (data.description) {
      this.description = data.description
    }

    this.extensions = data.extensions ?? {}
    this.extensions.condition = data.extensions?.condition ?? 'base'
    this.setType()
  }

  /**
   * The unique identifier of the token.
   */
  get id() {
    return toHash(`${this.name}-${this.extensions.condition}-${this.value}`)
  }

  /**
   * Whether the token is a conditional token.
   * Conditional tokens are tokens that have multiple values based on a condition.
   */
  get isConditional() {
    return !!this.extensions?.conditions
  }

  /**
   * Whether the token has a reference in its value.
   * e.g. {color.gray.100}
   */
  get hasReference() {
    return !!this.extensions?.references
  }

  /**
   * Whether the token is a complex or composite token.
   */
  get isComposite() {
    return isCompositeTokenValue(this.originalValue)
  }

  /**
   * Returns the token value with the references expanded.
   * e.g. {color.gray.100} => var(--colors-gray-100)
   *
   */
  expandReferences(): string {
    if (!this.hasReference) return this.extensions.varRef ?? this.value

    const references = this.extensions.references ?? {}

    this.value = Object.keys(references).reduce((valueStr, key) => {
      const referenceToken = references[key]

      // If a conditional token is referenced, we'll keep the reference
      if (referenceToken.isConditional) {
        return valueStr
      }
      const value = referenceToken.expandReferences()
      return valueStr.replace(`{${key}}`, value)
    }, this.value)

    delete this.extensions.references

    return this.value
  }

  /**
   * Whether this token has a reference to another token
   */
  get isReference() {
    return hasReference(this.originalValue)
  }

  /**
   * Returns the list of references in the token value
   */
  get references() {
    return getReferences(this.originalValue)
  }

  clone() {
    return new Token({
      name: this.name,
      value: this.value,
      type: this.type,
      path: [...this.path],
      description: this.description,
      extensions: cloneDeep(this.extensions),
    })
  }

  /**
   * Returns an array of tokens per conditions.
   * It is commonly used in semantic tokens, and can have multiple values based on a condition.
   * e.g. primary: { light: '#000', dark: '#fff' }
   */
  getConditionTokens(): Token[] | undefined {
    if (!this.isConditional) return
    const conditions = this.extensions.conditions ?? {}

    const conditionalTokens: Token[] = []

    walkObject(conditions, (value, path) => {
      const newPath = path.filter((v) => !isBaseCondition(v))
      if (!newPath.length) return

      const token = this.clone()

      token.value = value
      token.extensions.condition = newPath.join(':')

      conditionalTokens.push(token)
    })
    return conditionalTokens
  }

  /**
   * Add more extensions to the token
   */
  setExtensions(extensions: TokenExtensions) {
    this.extensions = { ...this.extensions, ...extensions }
    this.setType()
    return this
  }

  setType() {
    if (this.type) return
    if (this.extensions.category) {
      this.type = TOKEN_TYPES[this.extensions.category as keyof typeof TOKEN_TYPES]
    }
  }
}

function cloneDeep<T>(value: T): any {
  if (value instanceof Token) {
    return value.clone()
  }

  if (Array.isArray(value)) {
    return value.map((child) => cloneDeep(child))
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneDeep(v)]))
  }

  return value
}

const TOKEN_TYPES = {
  colors: 'color',
  spacing: 'dimension',
  sizing: 'dimension',
  shadows: 'shadow',
  fonts: 'fontFamily',
  fontSizes: 'fontSize',
  fontWeights: 'fontWeight',
  letterSpacings: 'letterSpacing',
  durations: 'duration',
  transitions: 'transition',
  radii: 'borderRadius',
  gradients: 'gradient',
  easings: 'cubicBezier',
  borders: 'border',
  borderWidths: 'borderWidth',
  components: 'cti',
  assets: 'asset',
  aspectRatios: 'aspectRatio',
}
