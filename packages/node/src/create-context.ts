import type { LoadConfigResult } from '@css-panda/config'
import { createConditions, Utility, GeneratorContext, mergeRecipes, mergeUtilities, Stylesheet } from '@css-panda/core'
import { logger } from '@css-panda/logger'
import { TokenMap } from '@css-panda/tokens'
import type { Pattern, TransformHelpers } from '@css-panda/types'
import fs from 'fs-extra'
import path from 'path'
import postcss from 'postcss'
import { Writer } from 'steno'

const BASE_IGNORE = ['node_modules', '.git']

function mergePatterns(values: Pattern[]) {
  return values.reduce<Record<string, Pattern>>((acc, value) => {
    Object.assign(acc, { [value.name]: value })
    return acc
  }, {})
}

function mapObject(obj: string | Record<string, any>, fn: (value: any) => any) {
  if (typeof obj === 'string') return fn(obj)
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]))
}

export function createContext(conf: LoadConfigResult) {
  const { config } = conf

  const {
    cwd: _cwd = process.cwd(),
    breakpoints = {},
    conditions = {},
    tokens = {},
    semanticTokens = {},
    cssVar,
    outdir,
    exclude,
    patterns = [],
    recipes = [],
    utilities: _utilities = [],
  } = config

  const cwd = path.resolve(_cwd)

  const configPath = path.join(cwd, outdir, 'config.js')
  const cssPath = path.join(cwd, outdir, 'css')
  const dsPath = path.join(cwd, outdir, 'design-tokens')
  const typesPath = path.join(cwd, outdir, 'types')
  const recipePath = path.join(cwd, outdir, 'recipes')
  const patternPath = path.join(cwd, outdir, 'patterns')
  const assetPath = path.join(cwd, outdir, 'assets')
  const outCssPath = path.join(cwd, outdir, 'styles.css')
  const jsxPath = path.join(cwd, outdir, 'jsx')

  const dictionary = new TokenMap({
    tokens,
    semanticTokens,
    prefix: cssVar?.prefix,
  })

  const utilities = new Utility({
    tokens: dictionary,
    config: mergeUtilities(_utilities),
  })

  const helpers: TransformHelpers = {
    map: mapObject,
  }

  const context = (): GeneratorContext => ({
    root: postcss.root(),
    breakpoints,
    conditions: createConditions({
      conditions,
      breakpoints,
    }),
    helpers,
    transform(prop, value) {
      return utilities.resolve(prop, value)
    },
  })

  const ctx = context()

  const stylesheet = new Stylesheet(ctx)

  const assets = {
    dir: assetPath,
    getPath(file: string) {
      return path.join(assets.dir, assets.format(file))
    },
    readFile(file: string) {
      return fs.readFile(path.join(assets.dir, file), 'utf8')
    },
    getFiles() {
      return fs.readdirSync(assets.dir)
    },
    format(file: string) {
      return file.replaceAll(path.sep, '__').replace(path.extname(file), '.css')
    },
    async write(file: string, css: string) {
      if (!css) return
      const filepath = assets.getPath(file)
      await fs.writeFile(filepath, css)
      logger.debug({ type: 'asset:write', file, path: filepath })
    },
    rm(file: string) {
      fs.unlinkSync(assets.getPath(file))
    },
    glob: [`${assetPath}/**/*.css`],
  }

  const outputWriter = new Writer(outCssPath)

  const outputCss = {
    path: outCssPath,
    write(css: string) {
      return outputWriter.write(css)
    },
  }

  const cssPropKeys = Array.from(
    // prettier-ignore
    new Set([
      'css',
      ...Object.keys(utilities.config.properties),
      ...Object.keys(ctx.conditions.values),
    ]),
  )

  return {
    ...config,
    cwd,
    exclude: BASE_IGNORE.concat(outdir, exclude ?? []),

    importMap: {
      css: `${outdir}/css`,
      recipe: `${outdir}/recipes`,
      pattern: `${outdir}/patterns`,
      jsx: `${outdir}/jsx`,
    },

    recipes: mergeRecipes(recipes, utilities),
    patterns: mergePatterns(patterns),

    outputCss,
    assets,

    hasTokens: !dictionary.isEmpty,
    hasRecipes: recipes.length > 0,
    hasPatterns: patterns.length > 0,

    paths: {
      asset: assetPath,
      css: cssPath,
      ds: dsPath,
      types: typesPath,
      recipe: recipePath,
      pattern: patternPath,
      config: configPath,
      jsx: jsxPath,
    },

    helpers,

    cssPropKeys,
    isUtilityProp(prop: string) {
      const regex = new RegExp('^(?:' + Array.from(cssPropKeys).join('|') + ')$')
      return regex.test(prop)
    },

    conf,
    config,
    configPath,
    dictionary,
    context,
    stylesheet,
    utilities,
  }
}

export type Context = ReturnType<typeof createContext>
