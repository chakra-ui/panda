import { Conditions, Recipes, Stylesheet, Utility, assignCompositions, type StylesheetContext } from '@pandacss/core'
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
import { HashFactory } from './hash-factory'
import { StaticCss } from './static-css'
import { StyleCollector } from './style-collector'

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
  hashFactory: HashFactory
  styleCollector: StyleCollector
  staticCss: StaticCss

  // Props
  properties!: Set<string>
  isValidProperty!: (key: string) => boolean

  // Layers
  layerNames!: CascadeLayers

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
    this.layerNames = config.layers as CascadeLayers
    this.setupProperties()

    // Relies on this.conditions, this.utility, this.layers
    this.recipes = this.createRecipes(theme, this.createSheetContext())

    this.hashFactory = new HashFactory(this)
    this.styleCollector = new StyleCollector(this)
    this.staticCss = new StaticCss(this, { hash: this.hashFactory, styles: this.styleCollector })
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

  get layerList() {
    return Object.values(this.layerNames)
  }

  get layers() {
    const layerList = Object.values(this.layerNames)
    return {
      name: this.layerNames,
      list: layerList,
      rule: `@layer ${layerList.join(', ')};`,
      isValidLayerRule: memo((layerRule: string) => {
        const names = new Set(layerRule.split(',').map((name) => name.trim()))
        return names.size >= 5 && layerList.every((name) => names.has(name))
      }),
    }
  }

  get staticSheetContext(): Omit<StylesheetContext, 'root' | 'layers'> {
    return {
      conditions: this.conditions,
      utility: this.utility,
      helpers,
      hash: this.hash.className,
      layersNames: this.layerNames,
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

  setupProperties(): void {
    this.properties = new Set(['css', ...this.utility.keys(), ...this.conditions.keys()])
    this.isValidProperty = memo((key: string) => this.properties.has(key) || isCssProperty(key))
  }

  createSheetRoot(): Pick<StylesheetContext, 'root' | 'layers'> {
    const layersNames = this.layers.name
    const reset = postcss.atRule({ name: 'layer', params: layersNames.reset, nodes: [] })
    const base = postcss.atRule({ name: 'layer', params: layersNames.base, nodes: [] })
    const tokens = postcss.atRule({ name: 'layer', params: layersNames.tokens, nodes: [] })
    const recipes = postcss.atRule({ name: 'layer', params: layersNames.recipes, nodes: [] })
    const recipes_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    const recipes_slots = postcss.atRule({ name: 'layer', params: layersNames.recipes + '.slots', nodes: [] })
    const recipes_slots_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    const utilities = postcss.atRule({ name: 'layer', params: layersNames.utilities, nodes: [] })
    const compositions = postcss.atRule({ name: 'layer', params: 'compositions', nodes: [] })
    const root = postcss.root()

    return {
      root,
      layers: {
        reset,
        base,
        tokens,
        recipes,
        recipes_base,
        recipes_slots,
        recipes_slots_base,
        utilities,
        compositions,
        insert: () => {
          if (reset.nodes.length) root.append(reset)
          if (base.nodes.length) root.append(base)
          if (tokens.nodes.length) root.append(tokens)

          if (recipes_base.nodes.length) recipes.prepend(recipes_base)
          if (recipes.nodes.length) root.append(recipes)

          if (recipes_slots_base.nodes.length) recipes_slots.prepend(recipes_slots_base)
          if (recipes_slots.nodes.length) root.append(recipes_slots)

          if (compositions.nodes.length) utilities.prepend(compositions)
          if (utilities.nodes.length) root.append(utilities)
          return root
        },
      },
    }
  }

  createSheetContext(): StylesheetContext {
    return Object.assign(this.createSheetRoot(), this.staticSheetContext)
  }

  createSheet(): Stylesheet {
    const sheetContext = this.createSheetContext()
    return new Stylesheet(sheetContext)
  }

  createRecipes(theme: Theme, context: StylesheetContext): Recipes {
    const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})
    return new Recipes(recipeConfigs, context)
  }

  collectStyles() {
    return this.styleCollector.collect(this.hashFactory)
  }
}
