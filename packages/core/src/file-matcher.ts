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
}

export interface FileMatcherOptions {
  importMap: ImportMapOutput<string>
  value: ImportResult[]
  userAliases: Partial<ImportAliases> | undefined
}

export class FileMatcher {
  // Context dependents
  private importMap: ImportMapOutput<string>

  private recipeAliases = new Set<string>()
  private patternAliases = new Set<string>()

  private propertiesMap = new Map<string, boolean>()
  private functions = new Map<string, Map<string, boolean>>()
  private components = new Map<string, Map<string, boolean>>()

  // File dependents
  fileImports: ImportResult[]
  cvaAlias = 'cva'
  svaAlias = 'sva'
  aliases: ImportAliases = {
    css: ['css'],
    jsxFactory: [],
  }

  constructor(
    private context: Pick<Context, 'jsx' | 'patterns' | 'recipes' | 'isValidProperty'>,
    opts: FileMatcherOptions,
  ) {
    const { value, importMap, userAliases } = opts

    this.importMap = importMap
    this.fileImports = value

    this.assignAliases(userAliases)
    this.assignProperties()
  }

  private assignAliases(userAliases: FileMatcherOptions['userAliases'] = {}) {
    this.fileImports.forEach((result) => {
      const alias = result.alias

      if (this.isValidRecipe(alias)) {
        this.recipeAliases.add(alias)
        return
      }

      if (this.isValidPattern(alias)) {
        this.patternAliases.add(alias)
        return
      }

      const name = result.name
      if (name === 'css' || userAliases.css?.includes(name)) {
        this.aliases.css.push(alias)
        return
      }

      if (name === this.context.jsx.factoryName || userAliases.jsxFactory?.includes(name)) {
        this.aliases.jsxFactory.push(alias)
        return
      }

      if (name === 'cva') {
        this.cvaAlias = alias
        return
      }

      if (name === 'sva') {
        this.svaAlias = alias
        return
      }
    })
  }

  private assignProperties() {
    this.context.jsx.nodes.forEach((node) => {
      const alias = this.getAlias(node.jsxName)
      node.props?.forEach((prop) => this.propertiesMap.set(prop, true))
      this.functions.set(node.baseName, this.propertiesMap)
      this.functions.set(alias, this.propertiesMap)
      this.components.set(alias, this.propertiesMap)
    })
  }

  isEmpty = () => {
    return this.fileImports.length === 0
  }

  toString = () => {
    return this.fileImports.map((item) => item.alias).join(', ')
  }

  find = (id: string) => {
    return this.fileImports.find((o) => o.alias === id)
  }

  private createMatch = (mod: string, keys: string[]) => {
    const mods = this.fileImports.filter((o) => {
      const isFromMod = o.mod.includes(mod) || o.importMapValue?.includes(mod)
      const isOneOfKeys = keys.includes(o.name)
      return isFromMod && isOneOfKeys
    })

    return memo((id: string) => !!mods.find((mod) => mod.alias === id || mod.name === id))
  }

  match = (id: string) => {
    return !!this.find(id)
  }

  getName = (id: string) => {
    return this.find(id)?.name || id
  }

  getAlias = (id: string) => {
    return this.fileImports.find((o) => o.name === id)?.alias || id
  }

  isValidPattern = (id: string) => {
    const match = this.createMatch(this.importMap.pattern, this.context.patterns.keys)
    return match(id)
  }

  isValidRecipe = (id: string) => {
    const match = this.createMatch(this.importMap.recipe, this.context.recipes.keys)
    return match(id)
  }

  isRawFn = (fnName: string) => {
    const name = fnName.split('.raw')[0] ?? ''
    return name === 'css' || this.isValidPattern(name) || this.isValidRecipe(name)
  }

  normalizeFnName = (fnName: string) => {
    return this.isRawFn(fnName) ? fnName.replace('.raw', '') : fnName
  }

  isAliasFnName = memo((fnName: string) => {
    return (
      this.aliases.css.includes(fnName) ||
      fnName === this.cvaAlias ||
      fnName === this.svaAlias ||
      this.isJsxFactory(fnName)
    )
  })

  matchFn = memo((fnName: string) => {
    if (this.recipeAliases.has(fnName) || this.patternAliases.has(fnName)) return true
    if (this.isAliasFnName(fnName) || this.isRawFn(fnName)) return true
    return this.functions.has(fnName)
  })

  /**
   * Check if a tag is a jsx factory
   * `styled.div` or `styled.span`
   */
  isJsxFactory = memo((tagName: string) => {
    const { jsx } = this.context

    return Boolean(jsx.isEnabled && this.aliases.jsxFactory.some((alias) => tagName.startsWith(alias)))
  })

  /**
   * Check if a fn is a jsx factory
   * `styled("span", { ... }) or styled("div", badge)`
   */
  isJsxFactoryFn = memo((tagName: string) => {
    const { jsx } = this.context
    return Boolean(jsx.isEnabled && this.aliases.jsxFactory.includes(tagName))
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

export interface ImportAliases {
  css: string[]
  jsxFactory: string[]
}
