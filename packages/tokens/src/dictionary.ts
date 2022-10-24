import { getDotPath, getNegativePath, isObject, toPx, walkObject } from '@css-panda/shared'
import type { SemanticToken, SemanticTokens, Token, TokenEntries, Tokens } from '@css-panda/types'
import { match, P } from 'ts-pattern'
import { createToken, TokenData } from './token'

type Options = {
  tokens?: Tokens
  semanticTokens?: SemanticTokens
  prefix?: string
}

export class TokenDictionary {
  values = new Map<string, TokenData>()
  conditionValues = new Map<string, Map<string, TokenData>>()
  prefix: string | undefined

  constructor(options: Options) {
    const { tokens = {}, semanticTokens = {}, prefix } = options
    this.prefix = prefix

    walkObject(tokens, this.walkTokens, { stop: isTokenValue })
    walkObject(semanticTokens, this.walkSemanticTokens, { stop: isTokenValue })

    this.resolveReferences()
  }

  public get isEmpty() {
    return this.values.size === 0 && this.conditionValues.size === 0
  }

  resolveReferences = () => {
    const fn = (token: TokenData) => {
      // prevent same key issue { none: "none" } from becoming { none: var(--none) }
      if (token.key === token.value) return
      const entry = [token.category, token.value] as any
      token.value = this.resolveValue(entry)
    }
    this.values.forEach(fn)
    this.conditionValues.forEach((map) => map.forEach(fn))
  }

  get = (path: string, fallback?: string | number) => {
    const obj = Object.fromEntries(this.flatValues)
    return getDotPath(obj, path, fallback)
  }

  getByCategory = (category: string, value: string, fallback = value) => {
    if (!isString(value)) return value
    return this.get(`${category}.${value}`, fallback) as string
  }

  walkTokens = (token: Token, path: string[]) => {
    const { value, description } = token
    const key = path.join('.')

    const data = createToken({ path, value, description, prefix: this.prefix })

    this.values.set(key, data)

    if (data.category === 'spacing') {
      const negData = createToken({ path, value, description, negative: true, prefix: this.prefix })

      const negKey = getNegativePath(path).join('.')
      this.values.set(negKey, negData)
    }
  }

  walkSemanticTokens = (token: SemanticToken, path: string[]) => {
    const { value, description } = token
    const key = path.join('.')

    const values = isDesignToken(value) ? { base: value } : value

    for (const [condition, value] of Object.entries(values)) {
      const data = createToken({ path, value, description, condition, prefix: this.prefix })

      this.conditionValues.get(condition) ?? this.conditionValues.set(condition, new Map())
      this.conditionValues.get(condition)?.set(key, data)

      if (data.category === 'spacing') {
        const negData = createToken({ path, value, description, condition, negative: true, prefix: this.prefix })
        const negKey = getNegativePath(path).join('.')

        this.conditionValues.get(condition)?.set(negKey, negData)
      }
    }
  }

  private resolveValue = (entries: TokenEntries): string => {
    return match<TokenEntries, any>(entries)
      .with(['fonts', P.select()], (value) => {
        return toArray(value).join(', ')
      })
      .with(['shadows', P.select()], (shadow) => {
        const values = toArray(shadow).map((value) => {
          if (isString(value)) {
            return this.getByCategory('shadows', value)
          }
          const { x, y, blur, spread, color, inset } = value
          const rawColor = this.getByCategory('colors', color)
          return `${inset ? 'inset ' : ''}${toPx(x)} ${toPx(y)} ${toPx(blur)} ${toPx(spread)} ${rawColor}`
        })
        return values.join(', ')
      })
      .with(['gradients', P.select()], (value) => {
        if (isString(value)) {
          return this.getByCategory('gradients', value)
        }

        const { type, stops, placement } = value

        const rawStops = stops.map((stop) => {
          const { color, position } = stop
          const rawColor = this.getByCategory('colors', color)
          return `${rawColor} ${toPx(position)}`
        })

        return `${type}-gradient(${placement}, ${rawStops.join(', ')})`
      })

      .with(['easings', P.select()], (value) => {
        if (isString(value)) {
          return this.getByCategory('easings', value)
        }
        return `cubic-bezier(${value.join(', ')})`
      })

      .with(['borders', P.select()], (value) => {
        if (isString(value)) {
          return this.getByCategory('borders', value)
        }
        const { width, style, color } = value
        const rawColor = this.getByCategory('colors', color)
        return `${toPx(width)} ${style} ${rawColor}`
      })

      .otherwise(([category, value]) => {
        const _value = value as string | number | string[] | number[]
        const str = toArray(_value).join(', ')
        return this.getByCategory(category, str)
      })
  }

  forEach = (fn: (value: TokenData, key: string) => void) => {
    this.values.forEach((token, key) => {
      fn(token, key)
    })
    this.conditionValues.forEach((map, condition) => {
      if (condition !== 'base') return
      map.forEach((token, key) => {
        fn(token, key)
      })
    })
  }

  get vars() {
    const map = new Map<string, string>()
    this.forEach((token) => {
      if (token.negative) return
      map.set(token.var, token.value)
    })
    return map
  }

  get flatValues() {
    const map: Map<string, Record<string, string>> = new Map()

    this.categoryMap.forEach((group, category) => {
      group.forEach((token, key) => {
        map.get(category) ?? map.set(category, {})
        map.get(category)![key] = token.varRef
      })
    })

    return map
  }

  get conditionVars() {
    const map = new Map<string, Map<string, string>>()

    this.conditionValues.forEach((values, condition) => {
      if (condition === 'base') return

      const varData = new Map<string, string>()
      values.forEach((token) => {
        if (token.negative) return
        varData.set(token.var, token.value)
      })

      map.set(condition, varData)
    })

    return map
  }

  get categoryMap() {
    const map = new Map<string, Map<string, TokenData>>()
    this.forEach((token) => {
      map.get(token.category) ?? map.set(token.category, new Map())
      map.get(token.category)?.set(token.key, token)
    })
    return map
  }
}

function isDesignToken(v: any): v is string {
  return (
    Array.isArray(v) ||
    isCompositeShadow(v) ||
    isCompositeBorder(v) ||
    isString(v) ||
    typeof v === 'number' ||
    typeof v === 'boolean'
  )
}

function isCompositeShadow(v: any) {
  return isObject(v) && ['x', 'y', 'blur', 'spread', 'color', 'inset'].some((key) => key in v)
}

function isCompositeBorder(v: any): v is boolean {
  return isObject(v) && ['color', 'width', 'style'].some((key) => key in v)
}

function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v]
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isTokenValue(v: any): v is { value: any } {
  return isObject(v) && 'value' in v
}
