import {
  Conditions,
  Recipes,
  Stylesheet,
  Utility,
  assignCompositions,
  type StylesheetContext,
  type StylesheetOptions,
} from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { compact, mapObject, memo } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type {
  CascadeLayers,
  ConfigResultWithHooks,
  HashOptions,
  PrefixOptions,
  RequiredBy,
  StudioOptions,
  Theme,
  UserConfig,
  TSConfig as _TSConfig,
} from '@pandacss/types'
import { isBool, isStr } from 'lil-fp'
import postcss from 'postcss'
import { Patterns } from './pattern'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { getFileEngine } from './file'

const helpers = {
  map: mapObject,
}

export class Context {
  isTemplateLiteralSyntax!: boolean
  studio!: RequiredBy<NonNullable<StudioOptions['studio']>, 'outdir'>

  hash!: HashOptions
  prefix!: PrefixOptions

  // Engines
  tokens!: TokenDictionary
  utility!: Utility
  recipes!: Recipes
  conditions!: Conditions
  patterns!: Patterns
  jsx!: ReturnType<typeof getJsxEngine>
  paths!: ReturnType<typeof getPathEngine>
  file!: ReturnType<typeof getFileEngine>

  // Props
  properties!: string[]
  isValidProperty!: (key: string) => boolean

  // Layers
  layers!: CascadeLayers
  isValidLayerRule!: (layerRule: string) => boolean
  layerString!: string
  layerNames!: string[]

  constructor(public conf: ConfigResultWithHooks) {
    this.configureEngine(conf)
  }

  get config() {
    return this.conf.config
  }

  get hooks() {
    return this.conf.hooks
  }

  configureEngine(conf: ConfigResultWithHooks): void {
    const { config } = conf
    const theme = config.theme ?? {}

    this.isTemplateLiteralSyntax = config.syntax === 'template-literal'
    this.studio = { outdir: `${config.outdir}-studio`, ...conf.config.studio }
    this.setupHashAndPrefix(config)

    this.tokens = this.createTokenDictionary(theme)
    this.utility = this.createUtility(config)
    this.conditions = this.createConditions(config)
    this.patterns = new Patterns(config)
    this.jsx = getJsxEngine(config)
    this.paths = getPathEngine(config)
    this.file = getFileEngine(config)

    this.assignCompositions(theme)
    this.setupLayers(config.layers as CascadeLayers)
    this.recipes = this.createRecipes(theme, this.createSheetContext())
    this.setupProperties()
  }

  getHashOptions(config: UserConfig): HashOptions {
    return {
      tokens: isBool(config.hash) ? config.hash : config.hash?.cssVar,
      className: isBool(config.hash) ? config.hash : config.hash?.className,
    }
  }

  getPrefixOptions(config: UserConfig): PrefixOptions {
    return {
      tokens: isStr(config.prefix) ? config.prefix : config.prefix?.cssVar,
      className: isStr(config.prefix) ? config.prefix : config.prefix?.className,
    }
  }

  setupHashAndPrefix(config: UserConfig): void {
    this.hash = this.getHashOptions(config)
    this.prefix = this.getPrefixOptions(config)
  }

  createTokenDictionary(theme: Theme): TokenDictionary {
    return new TokenDictionary({
      breakpoints: theme.breakpoints,
      tokens: theme.tokens,
      semanticTokens: theme.semanticTokens,
      prefix: this.prefix.tokens,
      hash: this.hash.tokens,
    })
  }

  createUtility(config: UserConfig): Utility {
    return new Utility({
      prefix: this.prefix.className,
      tokens: this.tokens,
      config: this.isTemplateLiteralSyntax ? {} : config.utilities,
      separator: config.separator,
      shorthands: config.shorthands,
      strictTokens: config.strictTokens,
    })
  }

  createConditions(config: UserConfig): Conditions {
    return new Conditions({
      conditions: config.conditions,
      breakpoints: config.theme?.breakpoints,
    })
  }

  assignCompositions(theme: Theme): void {
    const { textStyles, layerStyles } = theme
    const compositions = compact({
      textStyle: textStyles,
      layerStyle: layerStyles,
    })
    const compositionContext = { conditions: this.conditions, utility: this.utility }
    assignCompositions(compositions, compositionContext)
  }

  setupLayers(layers: CascadeLayers): void {
    this.layers = layers
    this.layerNames = Object.values(layers)
    this.isValidLayerRule = memo((layerRule: string) => {
      const names = new Set(layerRule.split(',').map((name) => name.trim()))
      return names.size >= 5 && this.layerNames.every((name) => names.has(name))
    })
    this.layerString = `@layer ${this.layerNames.join(', ')};`
  }

  createSheetContext(): StylesheetContext {
    return {
      root: postcss.root(),
      conditions: this.conditions,
      utility: this.utility,
      hash: this.hash.className,
      helpers,
      layers: this.layers,
    }
  }

  createSheet(options?: Pick<StylesheetOptions, 'content'>): Stylesheet {
    const sheetContext = this.createSheetContext()
    return new Stylesheet(sheetContext, {
      content: options?.content,
      recipes: this.config.theme?.recipes,
      slotRecipes: this.config.theme?.slotRecipes,
    })
  }

  createRecipes(theme: Theme, context: StylesheetContext): Recipes {
    const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})
    return new Recipes(recipeConfigs, context)
  }

  setupProperties(): void {
    this.properties = Array.from(new Set(['css', ...this.utility.keys(), ...this.conditions.keys()]))
    const propertyMap = new Map(this.properties.map((prop) => [prop, true]))

    this.isValidProperty = memo((key: string) => {
      return propertyMap.has(key) || isCssProperty(key)
    })
  }
}
