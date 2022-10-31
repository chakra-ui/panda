import { Collector, createParser, createProject } from '@css-panda/ast'
import type { LoadConfigResult } from '@css-panda/config'
import { Conditions, discardDuplicate, StylesheetContext, Stylesheet, Utility } from '@css-panda/core'
import { NotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import { capitalize, mapObject, uncapitalize } from '@css-panda/shared'
import { TokenDictionary } from '@css-panda/token-dictionary'
import type { RecipeConfig } from '@css-panda/types'
import glob from 'fast-glob'
import { readdirSync } from 'fs'
import { emptyDir, ensureDir, existsSync } from 'fs-extra'
import { readFile, unlink, writeFile } from 'fs/promises'
import { extname, isAbsolute, join, relative, resolve, sep } from 'path'
import postcss from 'postcss'

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
    patterns = {},
    recipes = {},
    utilities = {},
    textStyles,
    layerStyles,
    hash,
    jsxFactory = 'panda',
    jsxFramework,
    globalCss,
  } = config

  const cwd = resolve(_cwd)
  const exclude = ['.git', 'node_modules', 'test-results'].concat(_exclude)

  /* -----------------------------------------------------------------------------
   * Core utilities
   * -----------------------------------------------------------------------------*/

  const tokens = new TokenDictionary({
    tokens: _tokens,
    semanticTokens,
    prefix: cssVar?.prefix,
  })

  const utility = new Utility({
    tokens: tokens,
    config: utilities,
    compositions: {
      textStyle: textStyles,
      layerStyle: layerStyles,
    },
  })

  const conditions = new Conditions({
    conditions: _conditions,
    breakpoints,
  })

  const context = (): StylesheetContext => ({
    root: postcss.root(),
    breakpoints,
    conditions,
    hash,
    helpers,
    utility,
    hasShorthand: utility.hasShorthand,
    resolveShorthand(prop) {
      return utility.resolveShorthand(prop)
    },
    transform(prop, value) {
      return utility.resolve(prop, value)
    },
  })

  /* -----------------------------------------------------------------------------
   * Patterns
   * -----------------------------------------------------------------------------*/

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

  const patternNodes = Object.entries(patterns).map(([name, pattern]) => ({
    name: pattern.jsx ?? capitalize(name),
    props: Object.keys(pattern.properties),
    baseName: name,
  }))

  function getPatternFnName(jsx: string) {
    return patternNodes.find((node) => node.name === jsx)?.baseName ?? uncapitalize(jsx)
  }

  /* -----------------------------------------------------------------------------
   * Recipes
   * -----------------------------------------------------------------------------*/

  function getRecipe(name: string): RecipeConfig {
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

  function absPath(str: string) {
    return isAbsolute(str) ? str : join(cwd, str)
  }

  const paths = {
    config: getPath('config.js'),
    css: getPath('css'),
    token: getPath('tokens'),
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
      let fileName = assets.format(file)
      fileName = join(paths.asset, fileName)
      if (!existsSync(fileName)) {
        return Promise.resolve('')
      }
      return io.read(fileName)
    },
    getFiles() {
      return readdirSync(assets.dir)
    },
    format(file: string) {
      return relative(cwd, file).replaceAll(sep, '__').replace(extname(file), '.css')
    },
    async write(file: string, css: string) {
      const fileName = assets.format(file)

      const oldCss = await assets.readFile(file)
      const newCss = config.clean ? css : discardDuplicate([oldCss.trim(), css.trim()].filter(Boolean).join('\n\n'))

      logger.debug({ type: 'asset:write', file, path: fileName })

      return write(paths.asset, [{ file: fileName, code: newCss }])
    },
    rm(file: string) {
      const fileName = assets.format(file)
      return io.rm(join(paths.asset, fileName))
    },
    glob: [`${paths.asset}/**/*.css`],
  }

  const files = glob.sync(config.include, { cwd, ignore: config.exclude, absolute: true })

  /* -----------------------------------------------------------------------------
   * Collect extracted styles
   * -----------------------------------------------------------------------------*/

  const importMap = {
    css: `${outdir}/css`,
    recipe: `${outdir}/recipes`,
    pattern: `${outdir}/patterns`,
    jsx: `${outdir}/jsx`,
  }

  const tsProject = createProject()
  tsProject.addSourceFilesAtPaths(files)

  const parseSourceFile = createParser({
    importMap,
    jsx: {
      factory: jsxFactory,
      isStyleProp: isProperty,
      nodes: patternNodes,
    },
  })

  function collectStyles(collector: Collector, file: string) {
    const sheet = new Stylesheet(context())

    if (globalCss) {
      sheet.addGlobalCss(globalCss)
    }

    collector.globalCss.forEach((result) => {
      sheet.processGlobalCss(result.data)
    })

    collector.css.forEach((result) => {
      sheet.processAtomic(result.data)
    })

    collector.cssMap.forEach((result) => {
      for (const data of Object.values(result.data)) {
        sheet.processAtomic(data)
      }
    })

    collector.jsx.forEach((result) => {
      const { data, type, name } = result
      const { css = {}, ...rest } = data

      const styles = { ...css, ...rest }

      // treat pattern jsx like regular pattern
      if (name && type === 'pattern') {
        collector.setPattern(getPatternFnName(name), { data: styles })
      } else {
        sheet.processAtomic(styles)
      }
    })

    collector.recipe.forEach((result, name) => {
      try {
        for (const item of result) {
          sheet.processRecipe(getRecipe(name), item.data)
        }
      } catch (error) {
        logger.error({ err: error })
      }
    })

    collector.pattern.forEach((result, name) => {
      try {
        for (const item of result) {
          const styles = execPattern(name, item.data)
          sheet.processAtomic(styles)
        }
      } catch (error) {
        logger.error({ err: error })
      }
    })

    if (collector.isEmpty) {
      return
    }

    return {
      css: sheet.toCss({ minify: config.minify }),
      file: assets.format(file),
    }
  }

  function extract(fn: (file: string) => Promise<{ css: string; file: string } | undefined>) {
    return Promise.all(files.map(fn))
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

    importMap,
    getSourceFile(file: string) {
      return tsProject.getSourceFile(absPath(file))
    },
    addSourceFile(file: string) {
      return tsProject.addSourceFileAtPath(absPath(file))
    },
    removeSourceFile(file: string) {
      const sourceFile = tsProject.getSourceFile(absPath(file))
      if (sourceFile) {
        return tsProject.removeSourceFile(sourceFile)
      }
    },
    parseSourceFile,

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
    hasPattern: Object.keys(patterns).length > 0,
    getPattern,
    execPattern,
    patternNodes,
    getPatternFnName,

    recipes,
    getRecipe,
    hasRecipes: Object.keys(recipes).length > 0,

    jsxFramework,
    jsxFactory,
    cssVarRoot: config.cssVar?.root ?? ':where(:root, :host)',

    properties,
    isProperty,

    extract,
  }
}

export type PandaContext = ReturnType<typeof createContext>
