import { memo } from '@pandacss/shared'
import type { ImportMapOutput } from '@pandacss/types'
import { match } from 'ts-pattern'
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

interface FileImportOptions {
  importMap: ImportMapOutput<string>
  value: ImportResult[]
}

export class FileImport {
  imports: ImportResult[]
  private importMap: ImportMapOutput<string>

  private recipeAliases = new Set<string>()
  private patternAliases = new Set<string>()

  private propertiesMap = new Map<string, boolean>()
  private functions = new Map<string, Map<string, boolean>>()
  private components = new Map<string, Map<string, boolean>>()

  constructor(
    private context: Pick<Context, 'jsx' | 'patterns' | 'recipes' | 'isValidProperty'>,
    opts: FileImportOptions,
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
      const isFromMod = o.mod.includes(mod) || o.importMapValue === mod
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
    return this.imports.find((o) => o.name === id)?.alias || id
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

  get cvaAlias() {
    return this.getAlias('cva')
  }

  get cssAlias() {
    return this.getAlias('css')
  }

  get svaAlias() {
    return this.getAlias('sva')
  }

  get jsxFactoryAlias() {
    return this.getAlias('jsx')
  }

  isAliasFnName = (fnName: string) => {
    return (
      fnName === this.cvaAlias ||
      fnName === this.cssAlias ||
      fnName === this.svaAlias ||
      fnName === this.jsxFactoryAlias
    )
  }

  matchFn = (fnName: string) => {
    if (this.recipeAliases.has(fnName) || this.patternAliases.has(fnName)) return true
    if (this.isAliasFnName(fnName) || this.isRawFn(fnName)) return true
    return this.functions.has(fnName)
  }

  isJsxFactory = (name: string) => {
    const { jsx } = this.context
    return Boolean(jsx.isEnabled && name.startsWith(this.jsxFactoryAlias))
  }

  matchTag = (tagName: string) => {
    // ignore fragments
    if (!tagName) return false
    const { jsx } = this.context
    return (
      this.components.has(tagName) ||
      isUpperCase(tagName) ||
      this.isJsxFactory(tagName) ||
      jsx.isJsxTagRecipe(tagName) ||
      jsx.isJsxTagPattern(tagName)
    )
  }

  matchTagProp = (tagName: string, propName: string) => {
    const { jsx, isValidProperty } = this.context
    return match(jsx.styleProps)
      .with(
        'all',
        () =>
          Boolean(this.components.get(tagName)?.has(propName)) ||
          isValidProperty(propName) ||
          this.propertiesMap.has(propName) ||
          jsx.isRecipeOrPatternProp(tagName, propName),
      )
      .with('minimal', () => propName === 'css' || jsx.isRecipeOrPatternProp(tagName, propName))
      .with('none', () => jsx.isRecipeOrPatternProp(tagName, propName))
      .exhaustive()
  }
}

const isUpperCase = (value: string) => value[0] === value[0]?.toUpperCase()
