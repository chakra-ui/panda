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

      if (result.kind === 'namespace') {
        // Add all patterns when using a namespace import
        // e.g. import * as p from '../styled-system/patterns'
        if (result.mod.includes(this.importMap.pattern)) {
          this.context.patterns.keys.forEach((pattern) => {
            this.patternAliases.add(pattern)
          })
        }

        // Add all recipes when using a namespace import
        // e.g. import * as r from '../styled-system/recipes'
        if (result.mod.includes(this.importMap.recipe)) {
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

  private createMatch = (mod: string, keys: string[]) => {
    const mods = this.imports.filter((o) => {
      const isFromMod = o.mod.includes(mod) || o.importMapValue?.includes(mod)
      const isOneOfKeys = o.kind === 'namespace' ? true : keys.includes(o.name)
      return isFromMod && isOneOfKeys
    })

    return memo((id: string) => {
      return !!mods.find((mod) => {
        // Match patterns/recipes when using a namespace import
        if (mod.kind === 'namespace') {
          return keys.includes(id)
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
    if (!this._patternsMatcher)
      this._patternsMatcher = this.createMatch(this.importMap.pattern, this.context.patterns.keys)
    const match = this._patternsMatcher
    return match(id)
  }
  private _recipesMatcher: ReturnType<typeof this.createMatch> | undefined
  isValidRecipe = (id: string) => {
    if (!this._recipesMatcher) this._recipesMatcher = this.createMatch(this.importMap.recipe, this.context.recipes.keys)
    const match = this._recipesMatcher
    return match(id)
  }

  isRawFn = (fnName: string) => {
    const name = fnName.split('.raw')[0] ?? ''
    return name === 'css' || this.isValidPattern(name) || this.isValidRecipe(name)
  }

  normalizeFnName = (fnName: string) => {
    if (this.isRawFn(fnName)) return fnName.replace('.raw', '')

    // ASSUMPTION: the only way to have a `.` in the fnName is
    // - when using `{fn}.raw` (handled above)
    // - when using a jsx factory (e.g. `<styled.div />`) (skipped in the condition below)

    // or when using a namespace import, which is the case handled in the condition below
    // import * as p from '../styled-system/patterns'
    // 'p.stack' => 'stack'
    if (!this.isJsxFactory(fnName) && fnName.includes('.')) {
      return fnName.split('.')[1]
    }

    return fnName
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
    if (this.functions.has(fnName)) return true

    const [namespace, identifier] = fnName.split('.')
    const ns = this.namespaces.get(namespace)
    if (ns) {
      if (ns.mod.includes(this.importMap.css) && cssEntrypointFns.has(identifier)) return true
      if (ns.mod.includes(this.importMap.recipe) && this.recipeAliases.has(identifier)) return true
      if (ns.mod.includes(this.importMap.pattern) && this.patternAliases.has(identifier)) return true

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
