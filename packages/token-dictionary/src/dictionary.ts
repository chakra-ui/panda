import { compact, isString, mapObject, memo, walkObject } from '@pandacss/shared'
import type { SemanticTokens, Tokens } from '@pandacss/types'
import { isMatching, match } from 'ts-pattern'
import { Token } from './token'
import { assertTokenFormat, getReferences, isToken } from './utils'

type EnforcePhase = 'pre' | 'post'

type Options = {
  prefix?: string
  hash?: boolean
}

export type TokenTransformer = {
  name: string
  enforce?: EnforcePhase
  type?: 'value' | 'name' | 'extensions'
  match?: (token: Token) => boolean
  transform: (token: Token, options: Options) => any
}

export type TokenDictionaryOptions = {
  tokens?: Tokens
  semanticTokens?: SemanticTokens
  breakpoints?: Record<string, string>
  prefix?: string
  hash?: boolean
}

export type TokenMiddleware = {
  enforce?: EnforcePhase
  transform: (dict: TokenDictionary, options: Options) => void
}

function expandBreakpoints(breakpoints?: Record<string, string>) {
  if (!breakpoints) return { breakpoints: {}, sizes: {} }
  return {
    breakpoints: mapObject(breakpoints, (value) => ({ value })),
    sizes: Object.fromEntries(Object.entries(breakpoints).map(([key, value]) => [`breakpoint-${key}`, { value }])),
  }
}

function filterDefault(path: string[]) {
  if (path[0] === 'DEFAULT') return path
  return path.filter((item) => item !== 'DEFAULT')
}

export class TokenDictionary {
  allTokens: Token[] = []
  prefix: string | undefined
  hash: boolean | undefined

  get allNames() {
    return Array.from(new Set(this.allTokens.map((token) => token.name)))
  }

  constructor(options: TokenDictionaryOptions) {
    const { tokens = {}, semanticTokens = {}, breakpoints, prefix, hash } = options

    const breakpointTokens = expandBreakpoints(breakpoints)

    const computedTokens = compact({
      ...tokens,
      breakpoints: breakpointTokens.breakpoints,
      sizes: {
        ...tokens.sizes,
        ...breakpointTokens.sizes,
      },
    })

    this.prefix = prefix
    this.hash = hash

    walkObject(
      computedTokens,
      (token, path) => {
        path = filterDefault(path)
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
        path = filterDefault(path)
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
    return this
  }

  private execTransform(name: string) {
    const transform = this.transforms.get(name)
    if (!transform) return

    this.allTokens.forEach((token) => {
      if (token.extensions.hasReference) return
      if (typeof transform.match === 'function' && !transform.match(token)) return

      const transformed = transform.transform(token, {
        prefix: this.prefix,
        hash: this.hash,
      })

      match(transform)
        .with({ type: 'extensions' }, () => {
          token.setExtensions(transformed)
        })
        .with({ type: 'value' }, () => {
          token.value = transformed
          if (token.isComposite) {
            token.originalValue = transformed
          }
        })
        .otherwise(() => {
          token[transform.type!] = transformed
        })
    })
  }

  transformTokens(enforce: EnforcePhase) {
    this.transforms.forEach((transform) => {
      if (transform.enforce === enforce) {
        this.execTransform(transform.name)
      }
    })
    return this
  }

  private middlewares: TokenMiddleware[] = []

  registerMiddleware(...middlewares: TokenMiddleware[]) {
    for (const middleware of middlewares) {
      middleware.enforce ||= 'pre'
      this.middlewares.push(middleware)
    }
    return this
  }

  applyMiddlewares(enforce: EnforcePhase) {
    this.middlewares.forEach((middleware) => {
      if (middleware.enforce === enforce) {
        middleware.transform(this, { prefix: this.prefix, hash: this.hash })
      }
    })
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
        }, {} as Record<string, any>),
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
    this.applyMiddlewares('pre')
    this.transformTokens('pre')
    this.addConditionalTokens()
    this.addReferences()
    this.expandReferences()
    this.applyMiddlewares('post')
    this.transformTokens('post')
  }

  get isEmpty() {
    return this.allTokens.length === 0
  }
}
