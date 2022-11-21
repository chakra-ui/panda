import { Collector, createParser, createProject } from '@pandacss/parser'
import type { LoadConfigResult } from '@pandacss/config'
import {
  assignCompositions,
  Conditions,
  discardDuplicate,
  Stylesheet,
  StylesheetContext,
  Utility,
} from '@pandacss/core'
import { NotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { capitalize, compact, mapObject, uncapitalize } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { RecipeConfig } from '@pandacss/types'
import glob from 'fast-glob'
import { readdirSync } from 'fs'
import { emptyDir, ensureDir, existsSync } from 'fs-extra'
import { readFile, unlink, writeFile } from 'fs/promises'
import { extname, isAbsolute, join, relative, resolve, sep } from 'path'
import postcss from 'postcss'
import type { Project } from 'ts-morph'

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
    cwd: cwdProp = process.cwd(),
    breakpoints = {},
    conditions: conditionsProp = {},
    tokens: tokensProp = {},
    semanticTokens = {},
    cssVarPrefix,
    cssVarRoot = ':where(:root, :host)',
    outdir,
    exclude: excludeProp = [],
    patterns = {},
    recipes = {},
    utilities = {},
    textStyles,
    layerStyles,
    hash,
    jsxFactory = 'panda',
    jsxFramework,
    globalCss,
    separator,
  } = config

  const cwd = resolve(cwdProp)
  const exclude = ['.git', 'node_modules', 'test-results'].concat(excludeProp)

  /* -----------------------------------------------------------------------------
   * Core utilities
   * -----------------------------------------------------------------------------*/

  const tokens = new TokenDictionary({
    tokens: tokensProp,
    semanticTokens,
    prefix: cssVarPrefix,
  })

  const utility = new Utility({
    tokens: tokens,
    config: utilities,
    separator,
  })

  const conditions = new Conditions({
    conditions: conditionsProp,
    breakpoints,
  })

  assignCompositions(
    { conditions, utility },
    compact({
      textStyle: textStyles,
      layerStyle: layerStyles,
    }),
  )

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
    chunk: getPath('chunks'),
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

  const chunks = {
    dir: paths.chunk,
    readFile(file: string) {
      let fileName = chunks.format(file)
      fileName = join(paths.chunk, fileName)
      if (!existsSync(fileName)) {
        return Promise.resolve('')
      }
      return io.read(fileName)
    },
    getFiles() {
      return readdirSync(chunks.dir)
    },
    format(file: string) {
      return relative(cwd, file).replaceAll(sep, '__').replace(extname(file), '.css')
    },
    async write(file: string, css: string) {
      const fileName = chunks.format(file)

      const oldCss = await chunks.readFile(file)
      const newCss = discardDuplicate([oldCss.trim(), css.trim()].filter(Boolean).join('\n\n'))

      logger.debug({ type: 'chunk:write', file, path: fileName })

      return write(paths.chunk, [{ file: fileName, code: newCss }])
    },
    rm(file: string) {
      const fileName = chunks.format(file)
      return io.rm(join(paths.chunk, fileName))
    },
    glob: [`${paths.chunk}/**/*.css`],
  }

  function getFiles() {
    return glob.sync(config.include, { cwd, ignore: config.exclude, absolute: true })
  }

  const files = getFiles()

  /* -----------------------------------------------------------------------------
   * Collect extracted styles
   * -----------------------------------------------------------------------------*/

  const importMap = {
    css: `${outdir}/css`,
    recipe: `${outdir}/recipes`,
    pattern: `${outdir}/patterns`,
    jsx: `${outdir}/jsx`,
  }

  const tsProject: Project = createProject()
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
      file: chunks.format(file),
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

    chunks,
    files,

    helpers,
    context,
    exclude,
    conditions,

    importMap,
    reloadSourceFiles() {
      const files = getFiles()
      for (const file of files) {
        const source = tsProject.getSourceFile(file)
        if (source) {
          source.refreshFromFileSystemSync()
        } else {
          tsProject.addSourceFileAtPath(file)
        }
      }
    },
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
    cssVarRoot,

    properties,
    isProperty,

    extract,
  }
}

export type PandaContext = ReturnType<typeof createContext>
