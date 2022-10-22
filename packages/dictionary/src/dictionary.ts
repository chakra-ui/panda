import { isObject, isString, memo, walkObject } from '@css-panda/shared'
import { isMatching } from 'ts-pattern'
import { getReferences } from './reference'
import { Token, TokenEntry } from './token'

const isToken = (value: any): value is TokenEntry => {
  return isObject(value) && 'value' in value
}

type TransformerEnforce = 'pre' | 'post'

export type TokenTransformer = {
  name: string
  enforce?: TransformerEnforce
  type?: 'value' | 'name' | 'extensions'
  match?: (token: Token) => boolean
  transform: (token: Token) => any
}

function assertTokenFormat(token: any): asserts token is TokenEntry {
  if (!isToken(token)) {
    throw new Error(`Invalid token format: ${JSON.stringify(token)}`)
  }
}

export class TokenDictionary {
  allTokens: Token[] = []

  constructor({
    tokens = {},
    semanticTokens = {},
  }: {
    tokens?: Record<string, any>
    semanticTokens?: Record<string, any>
  }) {
    walkObject(
      tokens,
      (token, path) => {
        assertTokenFormat(token)

        const category = path[0]
        const name = path.join('.')

        const node = new Token({ ...token, name, path })

        node.setExtensions({
          category,
          prop: path.slice(1).join('.'),
        })

        this.allTokens.push(node)
      },
      { stop: isToken },
    )

    walkObject(
      semanticTokens,
      (token, path) => {
        assertTokenFormat(token)

        const category = path[0]
        const name = path.join('.')

        const normalizedToken = isString(token.value) ? { value: { base: token.value } } : token
        const { value, ...restData } = normalizedToken

        const node = new Token({
          ...restData,
          name,
          value: value.base || '',
          path,
        })

        node.setExtensions({
          category,
          conditions: value,
          prop: path.slice(1).join('.'),
        })

        this.allTokens.push(node)
      },
      { stop: isToken },
    )
  }

  getByName = memo((name: string) => {
    for (const token of this.allTokens) {
      if (token.name === name) return token
    }
  })

  private transforms: Map<string, TokenTransformer> = new Map()

  registerTransform(...transforms: TokenTransformer[]) {
    transforms.forEach((transform) => {
      transform.type ||= 'value'
      transform.enforce ||= 'pre'
      this.transforms.set(transform.name, transform)
    })
  }

  private execTransform(name: string) {
    const transform = this.transforms.get(name)
    if (!transform) return

    this.allTokens.forEach((token) => {
      if (token.extensions.hasReference) return
      if (typeof transform.match === 'function' && !transform.match(token)) return
      const transformed = transform.transform(token)

      if (transform.type === 'extensions') {
        token.setExtensions(transformed)
      } else if (transform.type === 'value') {
        token.value = transformed
        if (token.isComposite) {
          token.originalValue = transformed
        }
      } else {
        token[transform.type!] = transformed
      }
    })
  }

  transformTokens(enforce: TransformerEnforce) {
    this.transforms.forEach((transform) => {
      if (transform.enforce === enforce) {
        this.execTransform(transform.name)
      }
    })
    return this
  }

  getReferences(value: string) {
    const refs = getReferences(value)
    return refs.map((ref) => this.getByName(ref)).filter(Boolean) as Token[]
  }

  usesReference(value: any) {
    if (!isString(value)) return false
    return this.getReferences(value).length > 0
  }

  addReferences() {
    this.allTokens.forEach((token) => {
      if (!this.usesReference(token.value)) return

      const references = this.getReferences(token.value)

      token.setExtensions({
        references: references.reduce((object, reference) => {
          object[reference.name] = reference
          return object
        }, {}),
      })
    })

    return this
  }

  filter(pattern: Partial<Token> | ((token: Token) => boolean)) {
    const predicate = typeof pattern === 'function' ? pattern : isMatching(pattern)
    return this.allTokens.filter(predicate)
  }

  addConditionalTokens() {
    const tokens: Token[] = []
    this.allTokens.forEach((token) => {
      tokens.push(token)
      const conditionalTokens = token.getConditionTokens()
      if (conditionalTokens && conditionalTokens.length > 0) {
        tokens.push(...conditionalTokens)
      }
    })
    this.allTokens = tokens
    return this
  }

  expandReferences() {
    this.allTokens.forEach((token) => {
      token.expandReferences()
    })
    return this
  }

  build() {
    this.transformTokens('pre')
    this.addConditionalTokens()
    this.addReferences()
    this.expandReferences()
    this.transformTokens('post')
  }
}
