import { compact, isString, mapObject, memo, walkObject } from '@pandacss/shared'
import type { SemanticTokens, Tokens } from '@pandacss/types'
import { isMatching, match } from 'ts-pattern'
import { isCompositeTokenValue } from './is-composite'
import { middlewares } from './middleware'
import { Token } from './token'
import { transforms } from './transform'
import { assertTokenFormat, expandReferences, getReferences, isToken, mapToJson } from './utils'

type EnforcePhase = 'pre' | 'post'

interface Options {
  prefix?: string
  hash?: boolean
}

export interface TokenTransformer {
  name: string
  enforce?: EnforcePhase
  type?: 'value' | 'name' | 'extensions'
  match?: (token: Token) => boolean
  transform: (token: Token, options: Options) => any
}

export interface TokenDictionaryOptions {
  tokens?: Tokens
  semanticTokens?: SemanticTokens
  breakpoints?: Record<string, string>
  prefix?: string
  hash?: boolean
}

export interface TokenMiddleware {
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
  byName: Map<string, Token> = new Map()

  constructor(private options: TokenDictionaryOptions) {
    this.setTokens()
  }

  init() {
    this.registerTransform(...transforms)
    this.registerMiddleware(...middlewares)
    this.build()

    return this
  }

  get prefix() {
    return this.options.prefix
  }

  get hash() {
    return this.options.hash
  }

  getByName = (path: string) => this.byName.get(path)

  setTokens() {
    const { tokens = {}, semanticTokens = {}, breakpoints } = this.options

    const breakpointTokens = expandBreakpoints(breakpoints)

    const computedTokens = compact({
      ...tokens,
      breakpoints: breakpointTokens.breakpoints,
      sizes: {
        ...tokens.sizes,
        ...breakpointTokens.sizes,
      },
    })

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

        this.registerToken(node)
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

        const normalizedToken =
          isString(token.value) || isCompositeTokenValue(token.value) ? { value: { base: token.value } } : token

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

        this.registerToken(node)
      },
      { stop: isToken },
    )
  }

  registerToken = (token: Token, transformPhase?: 'pre' | 'post') => {
    this.allTokens.push(token)
    this.byName.set(token.name, token)

    if (transformPhase) {
      this.transforms.forEach((transform) => {
        if (transform.enforce === transformPhase) {
          this.execTransformOnToken(transform, token)
        }
      })
    }
  }

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
      this.execTransformOnToken(transform, token)
    })
  }

  execTransformOnToken(transform: TokenTransformer, token: Token) {
    if (token.extensions.hasReference) return
    if (typeof transform.match === 'function' && !transform.match(token)) return

    const exec = (v: Token) => transform.transform(v, { prefix: this.prefix, hash: this.hash })

    const transformed = exec(token)

    match(transform)
      .with({ type: 'extensions' }, () => {
        token.setExtensions(transformed)
      })
      .with({ type: 'value' }, () => {
        token.value = transformed

        if (token.isComposite) {
          token.originalValue = transformed
        }

        if (token.extensions.conditions) {
          const conditions = token.extensions.conditions
          const transformedConditions = walkObject(conditions, (value) => exec({ value } as Token), {
            stop: isCompositeTokenValue,
          })
          token.setExtensions({
            conditions: transformedConditions,
          })
        }
      })
      .otherwise(() => {
        token[transform.type!] = transformed
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
    this.allTokens.forEach((token) => {
      const conditionalTokens = token.getConditionTokens()
      if (conditionalTokens && conditionalTokens.length > 0) {
        conditionalTokens.forEach((token) => {
          this.registerToken(token)
        })
      }
    })

    return this
  }

  expandTokenReferences() {
    this.allTokens.forEach((token) => {
      token.expandReferences()
    })
    return this
  }

  /**
   * Expand token references to their CSS variable
   */
  expandReferenceInValue(value: string) {
    return expandReferences(value, (path) => this.view.get(path))
  }

  /**
   * Resolve token references to their actual raw value
   */
  resolveReference(value: string) {
    return expandReferences(value, (key) => this.getByName(key)?.value)
  }

  build() {
    this.applyMiddlewares('pre')
    this.transformTokens('pre')
    this.addConditionalTokens()
    this.addReferences()
    this.expandTokenReferences()
    this.applyMiddlewares('post')
    this.transformTokens('post')
    this.setComputedView()

    return this
  }

  get isEmpty() {
    return this.allTokens.length === 0
  }

  view!: ReturnType<TokenDictionaryView['getTokensView']>

  setComputedView() {
    this.view = new TokenDictionaryView(this).getTokensView()
    return this
  }
}

export class TokenDictionaryView {
  constructor(private dictionary: TokenDictionary) {
    this.dictionary = dictionary
  }

  getTokensView() {
    const conditionMap = new Map<string, Set<Token>>()
    const categoryMap = new Map<string, Map<string, Token>>()
    const colorPalettes = new Map<string, Map<string, string>>()
    const valuesByCategory = new Map<string, Map<string, string>>()
    const flatValues = new Map<string, string>()
    const vars = new Map<string, Map<string, string>>()

    this.dictionary.allTokens.forEach((token) => {
      this.processCondition(token, conditionMap)
      this.processColorPalette(token, colorPalettes, this.dictionary.byName)
      this.processCategory(token, categoryMap)
      this.processValue(token, valuesByCategory, flatValues)
      this.processVars(token, vars)
    })

    const json = mapToJson(valuesByCategory) as Record<string, Record<string, string>>
    return {
      conditionMap,
      categoryMap,
      colorPalettes,
      vars,
      values: flatValues,
      json,
      get: memo((path: string, fallback?: string | number) => {
        return (flatValues.get(path) ?? fallback) as string
      }),
      getCategoryValues: memo((category: string) => {
        const result = json[category]
        if (result != null) {
          return result
        }
      }),
    }
  }

  private processCondition(token: Token, group: Map<string, Set<Token>>) {
    const { condition } = token.extensions
    if (!condition) return

    if (!group.has(condition)) group.set(condition, new Set())
    group.get(condition)!.add(token)
  }

  private processColorPalette(token: Token, group: Map<string, Map<string, string>>, byName: Map<string, Token>) {
    const { colorPalette, colorPaletteRoots, isVirtual } = token.extensions
    if (!colorPalette || isVirtual) return

    colorPaletteRoots.forEach((colorPaletteRoot: string) => {
      if (!group.has(colorPaletteRoot)) {
        group.set(colorPaletteRoot, new Map())
      }

      const virtualName = token.name.replace(colorPaletteRoot, 'colorPalette')
      const virtualToken = byName.get(virtualName)
      if (!virtualToken) return

      const virtualVar = virtualToken.extensions.var
      group.get(colorPaletteRoot)!.set(virtualVar, token.extensions.varRef)
    })
  }

  private processCategory(token: Token, group: Map<string, Map<string, Token>>) {
    const { category, prop } = token.extensions
    if (!category) return

    if (!group.has(category)) group.set(category, new Map())
    group.get(category)!.set(prop, token)
  }

  private processValue(token: Token, byCategory: Map<string, Map<string, string>>, flat: Map<string, string>) {
    const { category, prop, varRef, isNegative } = token.extensions
    if (!category) return

    if (!byCategory.has(category)) byCategory.set(category, new Map())
    const value = isNegative ? (token.isConditional ? token.originalValue : token.value) : varRef
    byCategory.get(category)!.set(prop, value)
    flat.set(`${category}.${prop}`, value)
  }

  private processVars(token: Token, group: Map<string, Map<string, string>>) {
    const { condition, isNegative, isVirtual, var: varName } = token.extensions
    if (isNegative || isVirtual || !condition) return

    if (!group.has(condition)) group.set(condition, new Map())
    group.get(condition)!.set(varName, token.value)
  }
}
