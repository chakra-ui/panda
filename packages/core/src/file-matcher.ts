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

interface FileMatcherOptions {
  importMap: ImportMapOutput<string>
  value: ImportResult[]
}

export class FileMatcher {
  imports: ImportResult[]
  private importMap: ImportMapOutput<string>

  private cssAliases = new Set<string>()
  private cvaAliases = new Set<string>()
  private svaAliases = new Set<string>()
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

    this.assignAliases()
    this.assignProperties()
  }

  private assignAliases() {
    this.imports.forEach((result) => {
      if (this.isValidRecipe(result.alias)) {
        this.recipeAliases.add(result.alias)
      }

      if (this.isValidPattern(result.alias)) {
        this.patternAliases.add(result.alias)
      }

      if (result.name === 'css') {
        this.cssAliases.add(result.alias)
      }

      if (result.name === 'cva') {
        this.cvaAliases.add(result.alias)
      }

      if (result.name === 'sva') {
        this.svaAliases.add(result.alias)
      }

      if (result.name === this.context.jsx.factoryName) {
        this.jsxFactoryAliases.add(result.alias)
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

  private createMatch = (mod: string, keys: string[]) => {
    const mods = this.imports.filter((o) => {
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

  getAliases = (id: string) => {
    return this.imports.filter((o) => o.name === id).map((o) => o.alias || id)
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
      this.cvaAliases.has(fnName) ||
      this.cssAliases.has(fnName) ||
      this.svaAliases.has(fnName) ||
      this.isJsxFactory(fnName)
    )
  })

  matchFn = memo((fnName: string) => {
    if (this.recipeAliases.has(fnName) || this.patternAliases.has(fnName)) return true
    if (this.isAliasFnName(fnName) || this.isRawFn(fnName)) return true
    return this.functions.has(fnName)
  })

  isJsxFactory = memo((tagName: string) => {
    const { jsx } = this.context
    if (!jsx.isEnabled) return false

    for (const alias of this.jsxFactoryAliases) {
      if (tagName.startsWith(alias)) return true
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
