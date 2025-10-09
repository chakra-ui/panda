import { memo } from '@pandacss/shared'
import type { ImportMapOutput } from '@pandacss/types'
import type { Context } from './context'

export interface ImportResult {
  /** @example 'hstack' */
  name: string
  /** @example 'pandaHStack' */
  alias: string
  /**
   * @example '../../styled-system/patterns'
   * @example '@styles/patterns'
   */
  mod: string
  importMapValue?: string
  kind?: 'named' | 'namespace'
}

interface FileMatcherOptions {
  importMap: ImportMapOutput<string>
  value: ImportResult[]
}

const cssEntrypointFns = new Set(['css', 'cva', 'sva'])

export class FileMatcher {
  imports: ImportResult[]
  namespaces: Map<string, ImportResult> = new Map()
  private importMap: ImportMapOutput<string>

  private cssAliases = new Set<string>()
  private cvaAliases = new Set<string>()
  private svaAliases = new Set<string>()
  private tokenAliases = new Set<string>()
  private jsxFactoryAliases = new Set<string>()

  private recipeAliases = new Set<string>()
  private patternAliases = new Set<string>()

  private propertiesMap = new Map<string, boolean>()
  private functions = new Map<string, Map<string, boolean>>()
  private components = new Map<string, Map<string, boolean>>()

  constructor(
    private context: Pick<Context, 'jsx' | 'patterns' | 'recipes' | 'isValidProperty'>,
    opts: FileMatcherOptions,
  ) {
    const { value, importMap } = opts

    this.importMap = importMap
    this.imports = value
    this.imports.forEach((result) => {
      if (result.kind === 'namespace') {
        this.namespaces.set(result.name, result)
      }
    })

    this.assignAliases()
    this.assignProperties()
  }

  private assignAliases() {
    const isCssEntrypoint = this.createMatch(this.importMap.css, Array.from(cssEntrypointFns))
    const isTokensEntrypoint = this.createMatch(this.importMap.tokens, ['token'])

    this.imports.forEach((result) => {
      if (this.isValidRecipe(result.alias)) {
        this.recipeAliases.add(result.alias)
      }

      if (this.isValidPattern(result.alias)) {
        this.patternAliases.add(result.alias)
      }

      if (isCssEntrypoint(result.alias)) {
        if (result.name === 'css') {
          this.cssAliases.add(result.alias)
        }

        if (result.name === 'cva') {
          this.cvaAliases.add(result.alias)
        }

        if (result.name === 'sva') {
          this.svaAliases.add(result.alias)
        }
      }

      if (isTokensEntrypoint(result.alias)) {
        if (result.name === 'token') {
          this.tokenAliases.add(result.alias)
        }
      }

      if (result.name === this.context.jsx.factoryName) {
        this.jsxFactoryAliases.add(result.alias)
      }

      if (result.kind === 'namespace') {
        // Add all patterns when using a namespace import
        // e.g. import * as p from '../styled-system/patterns'
        if (this.importMap.pattern.some((m) => result.mod.includes(m))) {
          this.context.patterns.keys.forEach((pattern) => {
            this.patternAliases.add(pattern)
          })
        }

        // Add all recipes when using a namespace import
        // e.g. import * as r from '../styled-system/recipes'
        if (this.importMap.recipe.some((m) => result.mod.includes(m))) {
          this.context.recipes.keys.forEach((recipe) => {
            this.recipeAliases.add(recipe)
          })
        }
      }
    })
  }

  private assignProperties() {
    this.context.jsx.nodes.forEach((node) => {
      const aliases = this.getAliases(node.jsxName)
      aliases.forEach((alias) => {
        node.props?.forEach((prop) => this.propertiesMap.set(prop, true))
        this.functions.set(node.baseName, this.propertiesMap)
        this.functions.set(alias, this.propertiesMap)
        this.components.set(alias, this.propertiesMap)
      })
    })
  }

  isEmpty = () => {
    return this.imports.length === 0
  }

  toString = () => {
    return this.imports.map((item) => item.alias).join(', ')
  }

  find = (id: string) => {
    return this.imports.find((o) => o.alias === id)
  }

  private createMatch = (mods: string[], keys: string[]) => {
    const matchingImports = this.imports.filter((o) => {
      const isFromMod = mods.some((m) => o.mod.includes(m) || o.importMapValue?.includes(m))
      const isOneOfKeys = o.kind === 'namespace' ? true : keys.includes(o.name)
      return isFromMod && isOneOfKeys
    })

    return memo((id: string) => {
      return !!matchingImports.find((mod) => {
        // Match patterns/recipes when using a namespace import
        if (mod.kind === 'namespace') {
          return keys.includes(id.replace(`${mod.alias}.`, ''))
        }

        return mod.alias === id || mod.name === id
      })
    })
  }

  match = (id: string) => {
    return !!this.find(id)
  }

  getName = (id: string) => {
    return this.find(id)?.name || id
  }

  getAliases = (id: string) => {
    return this.imports.filter((o) => o.name === id).map((o) => o.alias || id)
  }

  private _patternsMatcher: ReturnType<typeof this.createMatch> | undefined

  isValidPattern = (id: string) => {
    this._patternsMatcher ||= this.createMatch(this.importMap.pattern, this.context.patterns.keys)
    return this._patternsMatcher(id)
  }

  private _recipesMatcher: ReturnType<typeof this.createMatch> | undefined

  isValidRecipe = (id: string) => {
    this._recipesMatcher ||= this.createMatch(this.importMap.recipe, this.context.recipes.keys)
    return this._recipesMatcher(id)
  }

  isRawFn = (fnName: string) => {
    const name = fnName.split('.raw')[0] ?? ''
    return name === 'css' || this.isValidPattern(name) || this.isValidRecipe(name)
  }

  isNamespaced = (fnName: string) => {
    return this.namespaces.has(fnName.split('.')[0])
  }

  normalizeFnName = (fnName: string) => {
    let name = fnName

    // remove namespace and join with dot
    if (this.isNamespaced(fnName)) {
      name = name.split('.').slice(1).join('.')
    }

    if (this.isRawFn(name)) return name.replace('.raw', '')
    return name
  }

  isAliasFnName = memo((fnName: string) => {
    return (
      this.cvaAliases.has(fnName) ||
      this.cssAliases.has(fnName) ||
      this.svaAliases.has(fnName) ||
      this.tokenAliases.has(fnName) ||
      this.isJsxFactory(fnName)
    )
  })

  isTokenAlias = (fnName: string) => {
    return this.tokenAliases.has(fnName)
  }

  matchFn = memo((fnName: string) => {
    if (this.recipeAliases.has(fnName) || this.patternAliases.has(fnName)) return true
    if (this.isAliasFnName(fnName) || this.isRawFn(fnName)) return true
    if (this.functions.has(fnName)) return true

    const [namespace, identifier] = fnName.split('.')
    const ns = this.namespaces.get(namespace)
    if (ns) {
      if (this.importMap.css.some((m) => ns.mod.includes(m)) && cssEntrypointFns.has(identifier)) return true
      if (this.importMap.tokens.some((m) => ns.mod.includes(m)) && identifier === 'token') return true
      if (this.importMap.recipe.some((m) => ns.mod.includes(m)) && this.recipeAliases.has(identifier)) return true
      if (this.importMap.pattern.some((m) => ns.mod.includes(m)) && this.patternAliases.has(identifier)) return true

      return this.functions.has(identifier)
    }

    return false
  })

  isJsxFactory = memo((tagName: string) => {
    const { jsx } = this.context
    if (!jsx.isEnabled) return false

    for (const alias of this.jsxFactoryAliases) {
      if (tagName.startsWith(alias)) return true
    }

    const [namespace, identifier] = tagName.split('.')
    const ns = this.namespaces.get(namespace)
    if (ns && this.importMap.jsx.some((m) => ns.mod.includes(m)) && identifier === this.context.jsx.factoryName) {
      return true
    }
  })

  isPandaComponent = memo((tagName: string) => {
    // ignore fragments
    if (!tagName) return false
    const { jsx } = this.context
    return (
      this.components.has(tagName) ||
      this.isJsxFactory(tagName) ||
      jsx.isJsxTagRecipe(tagName) ||
      jsx.isJsxTagPattern(tagName)
    )
  })

  matchTag = memo((tagName: string) => {
    return this.isPandaComponent(tagName) || isUpperCase(tagName)
  })

  matchTagProp = memo((tagName: string, propName: string) => {
    const { jsx, isValidProperty } = this.context
    switch (jsx.styleProps) {
      case 'all':
        return (
          Boolean(this.components.get(tagName)?.has(propName)) ||
          isValidProperty(propName) ||
          this.propertiesMap.has(propName) ||
          jsx.isRecipeOrPatternProp(tagName, propName)
        )
      case 'minimal':
        return propName === 'css' || jsx.isRecipeOrPatternProp(tagName, propName)
      case 'none':
        return jsx.isRecipeOrPatternProp(tagName, propName)
      default:
        return false
    }
  })
}

const isUpperCase = (value: string) => value[0] === value[0]?.toUpperCase()
