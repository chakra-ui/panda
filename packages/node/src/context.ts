import type { Collector } from '@css-panda/ast'
import type { LoadConfigResult } from '@css-panda/config'
import { Conditions, GeneratorContext, mergeRecipes, mergeUtilities, Stylesheet, Utility } from '@css-panda/core'
import { NotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import { mapObject } from '@css-panda/shared'
import { TokenMap } from '@css-panda/tokens'
import type { Pattern } from '@css-panda/types'
import glob from 'fast-glob'
import { readdirSync } from 'fs'
import { emptyDir, ensureDir } from 'fs-extra'
import { readFile, unlink, writeFile } from 'fs/promises'
import { outdent } from 'outdent'
import { extname, join, resolve, sep } from 'path'
import postcss from 'postcss'

function mergePatterns(values: Pattern[]) {
  return values.reduce<Record<string, Pattern>>((acc, value) => {
    Object.assign(acc, { [value.name]: value })
    return acc
  }, {})
}

type IO = {
  read(id: string): Promise<string>
  write(id: string, content: string): Promise<void>
  rm(id: string): Promise<void>
}

export type Output = {
  dir?: string
  files: Array<{
    file: string
    code: string | undefined
  }>
}

const helpers = {
  map: mapObject,
}

const fileSystem: IO = {
  read: (path: string) => {
    return readFile(path, 'utf-8')
  },
  write: (path: string, code: string) => {
    return writeFile(path, code)
  },
  rm: (path: string) => {
    return unlink(path)
  },
}

export function createContext(conf: LoadConfigResult, io = fileSystem) {
  const { config } = conf

  const {
    cwd: _cwd = process.cwd(),
    breakpoints = {},
    conditions: _conditions = {},
    tokens: _tokens = {},
    semanticTokens = {},
    cssVar,
    outdir,
    exclude: _exclude = [],
    patterns: _patterns = [],
    recipes: _recipes = [],
    utilities: _utilities = [],
    hash,
  } = config

  const cwd = resolve(_cwd)
  const exclude = ['.git', 'node_modules', 'test-results'].concat(_exclude)

  /* -----------------------------------------------------------------------------
   * Core utilities
   * -----------------------------------------------------------------------------*/

  const tokens = new TokenMap({
    tokens: _tokens,
    semanticTokens,
    prefix: cssVar?.prefix,
  })

  const utility = new Utility({
    tokens: tokens,
    config: mergeUtilities(_utilities),
  })

  const conditions = new Conditions({
    conditions: _conditions,
    breakpoints,
  })

  const context = (): GeneratorContext => ({
    root: postcss.root(),
    breakpoints,
    conditions,
    hash,
    helpers,
    utility,
    transform(prop, value) {
      return utility.resolve(prop, value)
    },
  })

  const ctx = context()

  /* -----------------------------------------------------------------------------
   * Patterns
   * -----------------------------------------------------------------------------*/

  const patterns = mergePatterns(_patterns)
  function getPattern(name: string) {
    const pattern = patterns[name]
    if (!pattern) {
      throw new NotFoundError({ type: 'pattern', name })
    }
    return pattern
  }
  function execPattern(name: string, data: Record<string, any>) {
    const pattern = getPattern(name)
    return pattern.transform?.(data, helpers) ?? {}
  }

  /* -----------------------------------------------------------------------------
   * Recipes
   * -----------------------------------------------------------------------------*/

  const recipes = mergeRecipes(_recipes, ctx)
  function getRecipe(name: string) {
    const recipe = recipes[name]
    if (!recipe) {
      throw new NotFoundError({ type: 'recipe', name })
    }
    return recipe
  }

  /* -----------------------------------------------------------------------------
   * User defined utilities or properties
   * -----------------------------------------------------------------------------*/

  const properties = Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()]))
  function isProperty(prop: string) {
    const regex = new RegExp('^(?:' + properties.join('|') + ')$')
    return regex.test(prop)
  }

  /* -----------------------------------------------------------------------------
   * Paths
   * -----------------------------------------------------------------------------*/

  function getPath(str: string) {
    return join(cwd, outdir, str)
  }

  const paths = {
    config: getPath('config.js'),
    css: getPath('css'),
    ds: getPath('design-tokens'),
    types: getPath('types'),
    recipe: getPath('recipes'),
    pattern: getPath('patterns'),
    asset: getPath('assets'),
    outCss: getPath('styles.css'),
    jsx: getPath('jsx'),
  }

  async function write(dir: string, options: Array<{ file: string; code: string | undefined }>) {
    await ensureDir(dir)
    return Promise.all(
      options.map(async ({ file, code }) => {
        const absPath = join(dir, file)
        if (code) {
          return io.write(absPath, code)
        }
      }),
    )
  }

  function cleanOutdir() {
    return emptyDir(outdir)
  }

  function writeOutput(output: Output) {
    const { dir = outdir, files } = output
    return write(dir, files)
  }

  /* -----------------------------------------------------------------------------
   *  Asssets (generated css per file)
   * -----------------------------------------------------------------------------*/

  const assets = {
    dir: paths.asset,
    readFile(file: string) {
      const fileName = assets.format(file)
      return io.read(join(paths.asset, fileName))
    },
    getFiles() {
      return readdirSync(assets.dir)
    },
    format(file: string) {
      return file.replaceAll(sep, '__').replace(extname(file), '.css')
    },
    write(file: string, css: string) {
      const fileName = assets.format(file)
      logger.debug({ type: 'asset:write', file, path: fileName })
      return write(paths.asset, [{ file: fileName, code: css }])
    },
    rm(file: string) {
      const fileName = assets.format(file)
      return io.rm(join(paths.asset, fileName))
    },
    glob: [`${paths.asset}/**/*.css`],
  }

  const files = glob.sync(config.include, { cwd, ignore: config.exclude })

  /* -----------------------------------------------------------------------------
   * Collect extracted styles
   * -----------------------------------------------------------------------------*/

  function collectStyles(collector: Collector, file: string) {
    const sheet = new Stylesheet(context())

    collector.globalStyle.forEach((result) => {
      sheet.processObject(result.data)
    })

    collector.fontFace.forEach((result) => {
      sheet.processFontFace(result)
    })

    collector.css.forEach((result) => {
      sheet.process(result)
    })

    collector.sx.forEach((result) => {
      sheet.process(result)
    })

    collector.cssMap.forEach((result) => {
      for (const data of Object.values(result.data)) {
        sheet.process({ type: 'object', data })
      }
    })

    collector.jsx.forEach((result) => {
      const { data, type } = result
      const { conditions = [], css = {}, ...rest } = data
      sheet.process({ type, data: { ...rest, ...css } })
      conditions.forEach((style: any) => {
        sheet.process(style)
      })
    })

    collector.recipe.forEach((result, name) => {
      try {
        for (const item of result) {
          const recipe = getRecipe(name)
          sheet.processRecipe(recipe, item.data)
        }
      } catch (error) {
        logger.error({ err: error })
      }
    })

    collector.pattern.forEach((result, name) => {
      try {
        for (const item of result) {
          const styleObject = execPattern(name, item.data)
          sheet.processAtomic(styleObject)
        }
      } catch (error) {
        logger.error({ err: error })
      }
    })

    if (collector.isEmpty()) {
      return
    }

    return {
      css: sheet.toCss(),
      file: assets.format(file),
    }
  }

  async function extract(fn: (file: string) => Promise<{ css: string; file: string } | undefined>) {
    const results = await Promise.all(files.map(fn))

    if (results.filter(Boolean).length === 0) {
      logger.warn({
        type: 'file:empty',
        msg: outdent`
          No style object or props were detected in your source files.
          If this is unexpected, double-check the \`include\` options in your Panda config\n
        `,
      })
    }
  }

  return {
    ...config,
    config,
    configPath: conf.path,
    cwd,
    conf,
    assets,
    files,
    helpers,
    context,
    exclude,
    conditions,

    importMap: {
      css: `${outdir}/css`,
      recipe: `${outdir}/recipes`,
      pattern: `${outdir}/patterns`,
      jsx: `${outdir}/jsx`,
    },

    getPath,
    paths,
    write,
    writeOutput,
    cleanOutdir,

    tokens,
    hasTokens: !tokens.isEmpty,

    utility,
    collectStyles,

    patterns,
    hasPattern: _patterns.length > 0,
    getPattern,
    execPattern,

    recipes,
    getRecipe,
    hasRecipes: _recipes.length > 0,

    jsxFramework: config.jsx?.framework ?? 'react',
    jsxFactory: config.jsx?.name ?? 'panda',
    cssVarRoot: config.cssVar?.root ?? ':where(:root, :host)',

    properties,
    isProperty,

    extract,
  }
}

export type PandaContext = ReturnType<typeof createContext>
