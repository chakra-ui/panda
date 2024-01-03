import { isCssProperty } from '@pandacss/is-valid-prop'
import { compact, isBoolean, isString, mapObject, memo } from '@pandacss/shared'
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
import { assignCompositions } from './compositions'
import { Conditions } from './conditions'
import { Layers } from './layers'
import { Patterns } from './patterns'
import { Recipes } from './recipes'
import { StaticCss } from './static-css'
import { StyleDecoder } from './style-decoder'
import { StyleEncoder } from './style-encoder'
import { Stylesheet } from './stylesheet'
import type { RecipeContext } from './types'
import { Utility } from './utility'

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

export class CoreContext {
  studio: RequiredBy<NonNullable<StudioOptions['studio']>, 'outdir'>

  // Engines
  tokens: TokenDictionary
  utility: Utility
  recipes: Recipes
  conditions: Conditions
  patterns: Patterns
  staticCss: StaticCss

  encoder: StyleEncoder
  decoder: StyleDecoder

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
    this.patterns = new Patterns({
      config,
      tokens: this.tokens,
      utility: this.utility,
    })

    this.studio = { outdir: `${config.outdir}-studio`, ...conf.config.studio }
    this.setupCompositions(theme)
    this.setupProperties()

    // Relies on this.conditions, this.utility, this.layers
    this.recipes = this.createRecipes(theme, this.baseSheetContext)

    this.encoder = new StyleEncoder(this)
    this.decoder = new StyleDecoder(this)
    this.staticCss = new StaticCss(this)
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
      tokens: isBoolean(this.config.hash) ? this.config.hash : this.config.hash?.cssVar,
      className: isBoolean(this.config.hash) ? this.config.hash : this.config.hash?.className,
    }
  }

  get prefix(): PrefixOptions {
    return {
      tokens: isString(this.config.prefix) ? this.config.prefix : this.config.prefix?.cssVar,
      className: isString(this.config.prefix) ? this.config.prefix : this.config.prefix?.className,
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

  get baseSheetContext() {
    return {
      conditions: this.conditions,
      utility: this.utility,
      helpers,
      hash: this.hash.className,
    }
  }

  createSheet(): Stylesheet {
    return new Stylesheet({
      ...this.baseSheetContext,
      layers: this.createLayers(this.config.layers as CascadeLayers),
    })
  }

  createRecipes(theme: Theme, context: RecipeContext): Recipes {
    const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})
    return new Recipes(recipeConfigs, context)
  }

  isValidLayerParams(params: string) {
    const names = new Set(params.split(',').map((name) => name.trim()))
    return names.size >= 5 && Object.values(this.config.layers as CascadeLayers).every((name) => names.has(name))
  }
}
