import {
  Conditions,
  Layers,
  Recipes,
  Stylesheet,
  Utility,
  assignCompositions,
  type RecipeContext,
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
} from '@pandacss/types'
import { isBool, isStr } from 'lil-fp'
import { FileEngine } from './file'
import { JsxEngine } from './jsx'
import { PathEngine } from './path'
import { Patterns } from './pattern'

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
  layers: Layers
  jsx: JsxEngine
  paths: PathEngine
  file: FileEngine
  stylesheet: Stylesheet

  // Props
  properties!: Set<string>
  isValidProperty!: (key: string) => boolean

  constructor(public conf: ConfigResultWithHooks) {
    const config = defaults(conf.config)
    const theme = config.theme ?? {}
    conf.config = config

    this.tokens = this.createTokenDictionary(theme)
    this.utility = this.createUtility(config)
    this.conditions = this.createConditions(config)
    this.layers = this.createLayers(config.layers as CascadeLayers)

    this.patterns = new Patterns(config)
    this.jsx = new JsxEngine(config)
    this.paths = new PathEngine(config)
    this.file = new FileEngine(config)

    this.studio = { outdir: `${config.outdir}-studio`, ...conf.config.studio }
    this.setupCompositions(theme)
    this.setupProperties()

    // Relies on this.conditions, this.utility, this.layers
    this.recipes = this.createRecipes(theme, this.baseSheetContext)
    this.stylesheet = this.createSheet()
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
      config: this.isTemplateLiteralSyntax ? {} : Object.assign({}, config.utilities),
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

  createLayers(layers: CascadeLayers): Layers {
    return new Layers(layers)
  }

  setupCompositions(theme: Theme): void {
    const { textStyles, layerStyles } = theme
    const compositions = compact({ textStyle: textStyles, layerStyle: layerStyles })
    assignCompositions(compositions, { conditions: this.conditions, utility: this.utility })
  }

  setupProperties(): void {
    this.properties = new Set(['css', ...this.utility.keys(), ...this.conditions.keys()])
    this.isValidProperty = memo((key: string) => this.properties.has(key) || isCssProperty(key))
  }

  private get baseSheetContext() {
    return {
      conditions: this.conditions,
      layers: this.layers,
      utility: this.utility,
      helpers,
      hash: this.hash.className,
    }
  }

  createSheet(): Stylesheet {
    return new Stylesheet({
      ...this.baseSheetContext,
      recipes: this.recipes,
    })
  }

  createRecipes(theme: Theme, context: RecipeContext): Recipes {
    const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})
    return new Recipes(recipeConfigs, context)
  }
}
