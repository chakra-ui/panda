import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { compact, flatten, isBoolean, isString, memo, patternFns } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type {
  CascadeLayers,
  HashOptions,
  LoadConfigResult,
  PandaHooks,
  PrefixOptions,
  PropertyConfig,
  RequiredBy,
  StudioOptions,
  Theme,
  UserConfig,
} from '@pandacss/types'
import { Conditions } from './conditions'
import { FileEngine } from './file'
import { HooksApi } from './hooks-api'
import { ImportMap } from './import-map'
import { JsxEngine } from './jsx'
import { Layers } from './layers'
import { getMessages, type Messages } from './messages'
import { PathEngine } from './path'
import { Patterns } from './patterns'
import { Recipes } from './recipes'
import { transformStyles } from './serialize'
import { StaticCss } from './static-css'
import { StyleDecoder } from './style-decoder'
import { StyleEncoder } from './style-encoder'
import { Stylesheet } from './stylesheet'
import type { ParserOptions, StylesheetContext } from './types'
import { Utility } from './utility'

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
  staticCss: StaticCss
  jsx: JsxEngine
  imports: ImportMap
  paths: PathEngine
  file: FileEngine

  encoder: StyleEncoder
  decoder: StyleDecoder
  hooksApi: HooksApi

  // Props
  properties!: Set<string>
  isValidProperty!: (key: string) => boolean
  messages: Messages
  parserOptions: ParserOptions

  constructor(public conf: LoadConfigResult) {
    const config = defaults(conf.config)
    const theme = config.theme ?? {}
    conf.config = config

    this.tokens = this.createTokenDictionary(theme)
    this.hooks['tokens:created']?.({
      configure: (opts) => {
        if (opts.formatTokenName) {
          this.tokens.formatTokenName = opts.formatTokenName
        }
        if (opts.formatCssVar) {
          this.tokens.formatCssVar = opts.formatCssVar
        }
      },
    })
    this.tokens.init()

    this.utility = this.createUtility(config)
    this.hooks['utility:created']?.({
      configure: (opts) => {
        if (opts.toHash) {
          this.utility.toHash = opts.toHash
        }
      },
    })

    this.conditions = this.createConditions(config)

    this.patterns = new Patterns({
      config,
      tokens: this.tokens,
      utility: this.utility,
      helpers: patternFns,
    })

    this.studio = { outdir: `${config.outdir}-studio`, ...conf.config.studio }
    this.setupProperties()

    // Relies on this.conditions, this.utility, this.layers
    this.recipes = this.createRecipes(theme)

    this.encoder = new StyleEncoder({
      utility: this.utility,
      recipes: this.recipes,
      conditions: this.conditions,
      patterns: this.patterns,
      isTemplateLiteralSyntax: this.isTemplateLiteralSyntax,
      isValidProperty: this.isValidProperty,
    })

    this.decoder = new StyleDecoder({
      conditions: this.conditions,
      utility: this.utility,
      recipes: this.recipes,
      hash: this.hash,
    })

    // Relies on this.encoder, this.decoder
    this.setupCompositions(theme)
    this.recipes.save(this.baseSheetContext)

    this.staticCss = new StaticCss({
      config,
      utility: this.utility,
      patterns: this.patterns,
      recipes: this.recipes,
      createSheet: this.createSheet,
      encoder: this.encoder,
      decoder: this.decoder,
    })

    this.jsx = new JsxEngine({
      patterns: this.patterns,
      recipes: this.recipes,
      config,
    })

    this.imports = new ImportMap({
      jsx: this.jsx,
      conf: this.conf,
      config: this.config,
      patterns: this.patterns,
      recipes: this.recipes,
      isValidProperty: this.isValidProperty,
    })

    this.paths = new PathEngine({
      config: this.config,
    })

    this.file = new FileEngine({
      config: this.config,
    })

    this.messages = getMessages({
      jsx: this.jsx,
      config: this.config,
      tokens: this.tokens,
      recipes: this.recipes,
      patterns: this.patterns,
      isTemplateLiteralSyntax: this.isTemplateLiteralSyntax,
    })

    this.parserOptions = {
      hash: this.hash,
      compilerOptions: this.conf.tsconfig?.compilerOptions ?? {},
      recipes: this.recipes,
      patterns: this.patterns,
      jsx: this.jsx,
      syntax: config.syntax,
      encoder: this.encoder,
      tsOptions: this.conf.tsOptions,
      join: (...paths: string[]) => paths.join('/'),
      imports: this.imports,
    }

    this.hooksApi = new HooksApi(this)
    this.hooks['context:created']?.({ ctx: this.hooksApi, logger: logger })
  }

  get config() {
    return this.conf.config
  }

  get hooks() {
    return this.conf.hooks ?? ({} as PandaHooks)
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

  createTokenDictionary = (theme: Theme): TokenDictionary => {
    return new TokenDictionary({
      breakpoints: theme.breakpoints,
      tokens: theme.tokens,
      semanticTokens: theme.semanticTokens,
      prefix: this.prefix.tokens,
      hash: this.hash.tokens,
    })
  }

  createUtility = (config: UserConfig): Utility => {
    return new Utility({
      prefix: this.prefix.className,
      tokens: this.tokens,
      config: this.isTemplateLiteralSyntax ? {} : Object.assign({}, config.utilities),
      separator: config.separator,
      shorthands: config.shorthands,
      strictTokens: config.strictTokens,
    })
  }

  createConditions = (config: UserConfig): Conditions => {
    return new Conditions({
      conditions: config.conditions,
      containerNames: config.theme?.containerNames,
      containerSizes: config.theme?.containerSizes,
      breakpoints: config.theme?.breakpoints,
    })
  }

  createLayers = (layers: CascadeLayers): Layers => {
    return new Layers(layers)
  }

  setupCompositions = (theme: Theme): void => {
    const { textStyles, layerStyles } = theme

    const compositions = compact({ textStyle: textStyles, layerStyle: layerStyles })

    const stylesheetCtx = {
      ...this.baseSheetContext,
      layers: this.createLayers(this.config.layers as CascadeLayers),
    }

    for (const [key, values] of Object.entries(compositions)) {
      // add the composition to the list of valid properties
      this.properties.add(key)

      const flatValues = flatten(values ?? {})

      const config: PropertyConfig = {
        layer: 'compositions',
        className: key,
        values: Object.keys(flatValues),
        transform: (value) => {
          return transformStyles(stylesheetCtx, flatValues[value], key + '.' + value)
        },
      }

      this.utility.register(key, config)
    }
  }

  setupProperties = (): void => {
    this.properties = new Set(['css', ...this.utility.keys(), ...this.conditions.keys()])
    this.isValidProperty = memo((key: string) => this.properties.has(key) || isCssProperty(key))
  }

  get baseSheetContext() {
    return {
      conditions: this.conditions,
      utility: this.utility,
      hash: this.hash.className,
      encoder: this.encoder,
      decoder: this.decoder,
      hooks: this.hooks,
      isValidProperty: this.isValidProperty,
      browserslist: this.config.browserslist,
      lightningcss: this.config.lightningcss,
      polyfill: this.config.polyfill,
      cssVarRoot: this.config.cssVarRoot!,
      helpers: patternFns,
    } satisfies Omit<StylesheetContext, 'layers'>
  }

  createSheet = (): Stylesheet => {
    return new Stylesheet({
      ...this.baseSheetContext,
      layers: this.createLayers(this.config.layers as CascadeLayers),
    })
  }

  createRecipes = (theme: Theme): Recipes => {
    const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})
    return new Recipes(recipeConfigs)
  }

  isValidLayerParams = (params: string) => {
    const names = new Set(params.split(',').map((name) => name.trim()))
    return names.size >= 5 && Object.values(this.config.layers as CascadeLayers).every((name) => names.has(name))
  }
}
