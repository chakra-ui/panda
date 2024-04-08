import {
  capitalize,
  compact,
  cssVar,
  isString,
  mapObject,
  memo,
  walkObject,
  type CssVar,
  type CssVarOptions,
} from '@pandacss/shared'
import type { Recursive, SemanticTokens, ThemeVariantsMap, TokenCategory, Tokens } from '@pandacss/types'
import { isMatching, match } from 'ts-pattern'
import { isCompositeTokenValue } from './is-composite'
import { middlewares } from './middleware'
import { Token, type TokenExtensions } from './token'
import { transforms, type ColorPaletteExtensions } from './transform'
import { assertTokenFormat, expandReferences, getReferences, isToken, mapToJson } from './utils'

type EnforcePhase = 'pre' | 'post'

export interface TokenTransformer {
  name: string
  enforce?: EnforcePhase
  type?: 'value' | 'name' | 'extensions'
  match?: (token: Token) => boolean
  transform: (token: Token, dictionary: TokenDictionary) => any
}

export interface TokenDictionaryOptions {
  tokens?: Tokens
  semanticTokens?: SemanticTokens
  breakpoints?: Record<string, string>
  themes?: ThemeVariantsMap | undefined
  prefix?: string
  hash?: boolean
}

export interface TokenMiddleware {
  enforce?: EnforcePhase
  transform: (dict: TokenDictionary) => void
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
  private deprecated: Set<string> = new Set()

  constructor(private options: TokenDictionaryOptions) {}

  init() {
    this.registerTokens()
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

  getByName = (path: string) => {
    return this.byName.get(path)
  }

  formatTokenName = (path: string[]): string => path.join('.')

  formatCssVar = (path: string[], options: CssVarOptions): CssVar => cssVar(path.join('-'), options)

  registerTokens() {
    const { tokens = {}, semanticTokens = {}, breakpoints, themes = {} } = this.options

    const breakpointTokens = expandBreakpoints(breakpoints)

    const computedTokens = compact({
      ...tokens,
      breakpoints: breakpointTokens.breakpoints,
      sizes: {
        ...tokens.sizes,
        ...breakpointTokens.sizes,
      },
    })

    const processToken = (token: Recursive<Token>, path: string[]) => {
      const isDefault = path.includes('DEFAULT')
      path = filterDefault(path)
      assertTokenFormat(token)

      const category = path[0]
      const name = this.formatTokenName(path)

      const node = new Token({ ...token, name, path })

      node.setExtensions({
        category,
        prop: this.formatTokenName(path.slice(1)),
      })

      if (isDefault) {
        node.setExtensions({ isDefault })
      }

      return node
    }

    const processSemantic = (token: SemanticTokens[keyof SemanticTokens], path: string[]) => {
      const isDefault = path.includes('DEFAULT')
      path = filterDefault(path)
      assertTokenFormat(token)

      const category = path[0]
      const name = this.formatTokenName(path)

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
        prop: this.formatTokenName(path.slice(1)),
      })

      if (isDefault) {
        node.setExtensions({ isDefault })
      }
      return node
    }

    // theme.tokens / theme.breakpoint
    walkObject(
      computedTokens,
      (token, path) => {
        const node = processToken(token, path)
        this.registerToken(node)
      },
      { stop: isToken },
    )

    // theme.semanticTokens
    walkObject(
      semanticTokens,
      (token, path) => {
        const node = processSemantic(token, path)
        this.registerToken(node)
      },
      { stop: isToken },
    )

    // themes[name].tokens / themes[name].semanticTokens
    Object.entries(themes).forEach(([theme, themeVariant]) => {
      const condName = '_theme' + capitalize(theme)

      // Treat theme.tokens as semanticTokens wrapped under the theme condition (e.g. _themeDark)
      walkObject(
        themeVariant.tokens ?? {},
        (token, path) => {
          const themeToken = { value: { [condName]: token.value } }
          const node = processSemantic(themeToken, path)
          node.setExtensions({ theme, isVirtual: true })
          this.registerToken(node)
        },
        { stop: isToken },
      )

      walkObject(
        themeVariant.semanticTokens ?? {},
        (token, path) => {
          const themeToken = { value: { [condName]: token.value } }
          const node = processSemantic(themeToken, path)
          node.setExtensions({ theme, isSemantic: true, isVirtual: true })
          this.registerToken(node)
        },
        { stop: isToken },
      )
    })

    return this
  }

  registerToken = (token: Token, transformPhase?: 'pre' | 'post') => {
    this.allTokens.push(token)
    this.byName.set(token.name, token)

    if (token.deprecated) {
      this.deprecated.add(token.name)
    }

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

    const exec = (v: Token) => transform.transform(v, this)

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
        middleware.transform(this)
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
        references: references.reduce(
          (object, reference) => {
            object[reference.name] = reference
            return object
          },
          {} as Record<string, any>,
        ),
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

  colorMix = (value: string, tokenFn: (path: string) => string) => {
    if (!value || typeof value !== 'string') return { invalid: true, value }

    const [colorPath, rawOpacity] = value.split('/')

    if (!colorPath || !rawOpacity) {
      return { invalid: true, value: colorPath }
    }

    const colorToken = tokenFn(colorPath)
    const opacityToken = this.getByName(`opacity.${rawOpacity}`)?.value

    if (!opacityToken && isNaN(Number(rawOpacity))) {
      return { invalid: true, value: colorPath }
    }

    const percent = opacityToken ? Number(opacityToken) * 100 + '%' : `${rawOpacity}%`
    const color = colorToken ?? colorPath

    return {
      invalid: false,
      color,
      value: `color-mix(in srgb, ${color} ${percent}, transparent)`,
    }
  }

  /**
   * Expand token references to their CSS variable
   */
  expandReferenceInValue(value: string) {
    return expandReferences(value, (path) => {
      if (path.includes('/')) {
        const mix = this.colorMix(path, this.view.get.bind(this.view))
        if (mix.invalid) {
          throw new Error('Invalid color mix at ' + path + ': ' + mix.value)
        }

        return mix.value
      }

      return this.view.get(path)
    })
  }

  /**
   * Get the value of a token reference
   */
  resolveReference(value: string) {
    return expandReferences(value, (key) => this.getByName(key)?.value)
  }

  /**
   * Resolve token references to their actual raw value (recursively resolves references)
   */
  deepResolveReference(originalValue: string) {
    const stack = [originalValue]
    while (stack.length) {
      const next = stack.pop()!

      if (next.startsWith('{')) {
        stack.push(this.resolveReference(next))
        continue
      }

      if (next.startsWith('var(')) {
        const ref = this.view.nameByVar.get(next)
        if (ref) {
          stack.push(this.resolveReference(`{${ref}}`))
          continue
        }
      }

      return next
    }
  }

  isDeprecated(name: string) {
    return this.deprecated.has(name)
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

/* -----------------------------------------------------------------------------
 * Computed token views
 * -----------------------------------------------------------------------------*/

type ConditionName = string
type TokenName = string
type VarName = string
type VarRef = string
type TokenValue = string
type ColorPalette = string

export class TokenDictionaryView {
  constructor(private dictionary: TokenDictionary) {
    this.dictionary = dictionary
  }

  getTokensView() {
    const conditionMap = new Map<ConditionName, Set<Token>>()
    const categoryMap = new Map<TokenCategory, Map<TokenName, Token>>()
    const colorPalettes = new Map<ColorPalette, Map<VarName, VarRef>>()
    const valuesByCategory = new Map<TokenCategory, Map<VarName, TokenValue>>()
    const flatValues = new Map<TokenName, VarRef>()
    const nameByVar = new Map<VarRef, TokenName>()
    const vars = new Map<ConditionName, Map<VarName, TokenValue>>()

    this.dictionary.allTokens.forEach((token) => {
      this.processCondition(token, conditionMap)
      this.processColorPalette(token, colorPalettes, this.dictionary.byName)
      this.processCategory(token, categoryMap)
      this.processValue(token, valuesByCategory, flatValues, nameByVar)
      this.processVars(token, vars)
    })

    const json = mapToJson(valuesByCategory) as Record<string, Record<string, string>>
    return {
      conditionMap,
      categoryMap,
      colorPalettes,
      vars,
      values: flatValues,
      nameByVar: nameByVar,
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
    const extensions = token.extensions as TokenExtensions<ColorPaletteExtensions>
    const { colorPalette, colorPaletteRoots, isVirtual } = extensions
    if (!colorPalette || isVirtual) return

    colorPaletteRoots.forEach((colorPaletteRoot) => {
      const formated = this.dictionary.formatTokenName(colorPaletteRoot)
      if (!group.has(formated)) {
        group.set(formated, new Map())
      }

      const virtualPath = replaceRootWithColorPalette([...token.path], [...colorPaletteRoot])
      const virtualName = this.dictionary.formatTokenName(virtualPath)
      const virtualToken = byName.get(virtualName)
      if (!virtualToken) return

      const virtualVar = virtualToken.extensions.var
      group.get(formated)!.set(virtualVar, token.extensions.varRef)

      if (extensions.isDefault && colorPaletteRoot.length === 1) {
        const colorPaletteName = this.dictionary.formatTokenName(['colors', 'colorPalette'])
        const colorPaletteToken = byName.get(colorPaletteName)
        if (!colorPaletteToken) return

        const name = this.dictionary.formatTokenName(token.path)
        const virtualToken = byName.get(name)
        if (!virtualToken) return

        const keyPath = extensions.colorPaletteTokenKeys[0]?.filter(Boolean)
        if (!keyPath.length) return

        const formated = this.dictionary.formatTokenName(colorPaletteRoot.concat(keyPath))
        if (!group.has(formated)) {
          group.set(formated, new Map())
        }

        group.get(formated)!.set(colorPaletteToken.extensions.var, virtualToken.extensions.varRef)
      }
    })
  }

  private processCategory(token: Token, group: Map<string, Map<string, Token>>) {
    const { category, prop } = token.extensions
    if (!category) return

    if (!group.has(category)) group.set(category, new Map())
    group.get(category)!.set(prop, token)
  }

  private processValue(
    token: Token,
    byCategory: Map<string, Map<string, string>>,
    flatValues: Map<string, string>,
    nameByVar: Map<string, string>,
  ) {
    const { category, prop, varRef, isNegative } = token.extensions
    if (!category) return

    if (!byCategory.has(category)) byCategory.set(category, new Map())
    const value = isNegative ? (token.extensions.condition !== 'base' ? token.originalValue : token.value) : varRef
    byCategory.get(category)!.set(prop, value)
    flatValues.set(token.name, value)
    nameByVar.set(value, token.name)
  }

  private processVars(token: Token, group: Map<string, Map<string, string>>) {
    const { condition, isNegative, isVirtual, var: varName, theme } = token.extensions
    if (isNegative || (!theme && isVirtual) || !condition) return

    if (!group.has(condition)) group.set(condition, new Map())
    group.get(condition)!.set(varName, token.value)
  }
}

/**
 * Replaces the colorPaletteRoot in token.path with 'colorPalette'
 * @example replaceRootWithColorPalette(['colors', 'button', 'red', '500'], ['button', 'red'])
 * // => ["colors", "colorPalette", "500"]
 */
function replaceRootWithColorPalette(path: string[], colorPaletteRoot: string[]) {
  // Find the starting index of colorPaletteRoot in path
  const startIndex = path.findIndex((element, index) =>
    colorPaletteRoot.every((rootElement, rootIndex) => path[index + rootIndex] === rootElement),
  )

  if (startIndex === -1) {
    // colorPaletteRoot not found in path, return original path
    return path
  }

  // Remove the elements of colorPaletteRoot from path
  path.splice(startIndex, colorPaletteRoot.length)

  // Insert 'colorPalette' at the startIndex
  path.splice(startIndex, 0, 'colorPalette')

  return path
}
