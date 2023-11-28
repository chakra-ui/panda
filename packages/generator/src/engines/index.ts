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
import { JsxEngine } from './jsx'
import { PathEngine } from './path'
import { FileEngine } from './file'

const helpers = { map: mapObject }

const defaults = (config: UserConfig): UserConfig => ({
  cssVarRoot: ':where(:root, :host)',
  jsxFactory: 'styled',
  jsxStyleProps: 'all',
  outExtension: 'mjs',
  shorthands: true,
  syntax: 'object-literal',
  ...config,
  layers: {
    reset: 'reset',
    base: 'base',
    tokens: 'tokens',
    recipes: 'recipes',
    utilities: 'utilities',
    ...config.layers,
  },
})

export class Context {
  studio: RequiredBy<NonNullable<StudioOptions['studio']>, 'outdir'>

  // Engines
  tokens: TokenDictionary
  utility: Utility
  recipes: Recipes
  conditions: Conditions
  patterns: Patterns
  jsx: JsxEngine
  paths: PathEngine
  file: FileEngine

  // Props
  properties!: Set<string>
  isValidProperty!: (key: string) => boolean

  // Layers
  layers!: CascadeLayers
  isValidLayerRule!: (layerRule: string) => boolean
  layerString!: string
  layerNames!: string[]

  constructor(public conf: ConfigResultWithHooks) {
    const config = defaults(conf.config)
    const theme = config.theme ?? {}
    conf.config = config

    this.tokens = this.createTokenDictionary(theme)
    this.utility = this.createUtility(config)
    this.conditions = this.createConditions(config)
    this.patterns = new Patterns(config)
    this.jsx = new JsxEngine(config)
    this.paths = new PathEngine(config)
    this.file = new FileEngine(config)

    this.studio = { outdir: `${config.outdir}-studio`, ...conf.config.studio }
    this.setupCompositions(theme)
    this.setupLayers(config.layers as CascadeLayers)
    this.setupProperties()

    // Relies on this.conditions, this.utility, this.layers
    this.recipes = this.createRecipes(theme, this.createSheetContext())
  }

  get config() {
    return this.conf.config
  }

  get hooks() {
    return this.conf.hooks
  }

  get isTemplateLiteralSyntax() {
    return this.config.syntax === 'template-literal'
  }

  get hash(): HashOptions {
    return {
      tokens: isBool(this.config.hash) ? this.config.hash : this.config.hash?.cssVar,
      className: isBool(this.config.hash) ? this.config.hash : this.config.hash?.className,
    }
  }

  get prefix(): PrefixOptions {
    return {
      tokens: isStr(this.config.prefix) ? this.config.prefix : this.config.prefix?.cssVar,
      className: isStr(this.config.prefix) ? this.config.prefix : this.config.prefix?.className,
    }
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

  setupCompositions(theme: Theme): void {
    const { textStyles, layerStyles } = theme
    const compositions = compact({ textStyle: textStyles, layerStyle: layerStyles })
    assignCompositions(compositions, { conditions: this.conditions, utility: this.utility })
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

  setupProperties(): void {
    this.properties = new Set(['css', ...this.utility.keys(), ...this.conditions.keys()])
    this.isValidProperty = memo((key: string) => this.properties.has(key) || isCssProperty(key))
  }

  createSheetContext(): StylesheetContext {
    return {
      root: postcss.root(),
      conditions: this.conditions,
      utility: this.utility,
      hash: this.hash.className,
      layers: this.layers,
      helpers,
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
}
