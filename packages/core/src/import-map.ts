import { isString } from '@pandacss/shared'
import type { ImportMapInput, ImportMapOutput, UserConfig } from '@pandacss/types'
import type { Context } from './context'
import { FileMatcher, type ImportResult } from './file-matcher'

interface ImportMatcher {
  mods: string[]
  regex: RegExp
  match(value: string): boolean
}

export class ImportMap {
  value: ImportMapOutput<string>
  matchers = {} as Record<keyof ImportMapOutput, ImportMatcher>
  outdir: string

  constructor(private context: Pick<Context, 'jsx' | 'config' | 'conf' | 'isValidProperty' | 'recipes' | 'patterns'>) {
    const { jsx } = this.context

    this.outdir = this.getOutdir()

    const importMap = this.buildImportMap(context.config.importMap)

    this.matchers.css = this.createMatcher(importMap.css, ['css', 'cva', 'sva'])
    this.matchers.recipe = this.createMatcher(importMap.recipe)
    this.matchers.pattern = this.createMatcher(importMap.pattern)

    if (jsx.isEnabled) {
      this.matchers.jsx = this.createMatcher(importMap.jsx, jsx.names)
    }

    this.value = importMap
  }

  /**
   * Normalize one/many import map inputs to a single import map output with absolute paths.
   * @example
   * ```ts
   * importMap: '@acme/org'
   * ```
   *
   * will be normalized to
   * ```ts
   * {
   *   css: ['@acme/org/css'],
   *   recipe: ['@acme/org/recipes'],
   *   pattern: ['@acme/org/patterns'],
   *   jsx: ['@acme/org/jsx'],
   * }
   * ```
   *
   * @exammple
   * importMap: ['@acme/org', '@foo/org', '@bar/org']
   * ```
   *
   * will be normalized to
   * ```ts
   * {
   *   css: ['@acme/org/css', '@foo/org/css', '@bar/org/css'],
   *   recipe: ['@acme/org/recipes', '@foo/org/recipes', '@bar/org/recipes'],
   *   pattern: ['@acme/org/patterns', '@foo/org/patterns', '@bar/org/patterns'],
   *   jsx: ['@acme/org/jsx', '@foo/org/jsx', '@bar/org/jsx'],
   * }
   * ```
   */
  buildImportMap = (option: UserConfig['importMap']): ImportMapOutput<string> => {
    const output: ImportMapOutput<string> = { css: [], recipe: [], pattern: [], jsx: [] }
    const inputs = asArray(option)

    inputs.forEach((input) => {
      const normalized = this.normalize(input)
      output.css.push(...normalized.css)
      output.recipe.push(...normalized.recipe)
      output.pattern.push(...normalized.pattern)
      if (normalized.jsx) output.jsx.push(...normalized.jsx)
    })

    return output
  }

  private fromString = (map: string): ImportMapOutput => {
    return {
      css: [[map, 'css'].join('/')],
      recipe: [[map, 'recipes'].join('/')],
      pattern: [[map, 'patterns'].join('/')],
      jsx: [[map, 'jsx'].join('/')],
    }
  }

  private fromInput = (map: ImportMapInput | undefined): ImportMapOutput => {
    const { css, recipes, patterns, jsx } = map ?? {}
    return {
      css: css ? asArray(css) : [[this.outdir, 'css'].join('/')],
      recipe: recipes ? asArray(recipes) : [[this.outdir, 'recipes'].join('/')],
      pattern: patterns ? asArray(patterns) : [[this.outdir, 'patterns'].join('/')],
      jsx: jsx ? asArray(jsx) : [[this.outdir, 'jsx'].join('/')],
    }
  }

  private getOutdir = () => {
    const { outdir } = this.context.config

    const split = outdir.split('/')
    return split[split.length - 1]
  }

  normalize = (map: string | ImportMapInput | undefined): ImportMapOutput => {
    if (isString(map)) return this.fromString(map)
    return this.fromInput(map)
  }

  private createMatcher = (mods: string[], values?: string[]): ImportMatcher => {
    const regex = values ? new RegExp(`^(${values.join('|')})$`) : /.*/
    const match = (value: string) => regex.test(value)
    return { mods, regex, match }
  }

  match = (result: ImportResult | undefined, resolveTsPath?: (mod: string) => string | undefined): boolean => {
    if (!result) return false

    for (const { regex, mods } of Object.values(this.matchers)) {
      // if none of the imported values match the regex, skip
      if (result.kind !== 'namespace' && !regex.test(result.name)) continue

      // this checks that `yyy` contains {outdir}/{folder} in `import xxx from yyy`
      if (mods.some((m) => result.mod.includes(m))) {
        return true
      }

      // that might be a TS path mapping, it could be completely different from the actual path
      const resolvedMod = resolveTsPath?.(result.mod)

      for (const mod of mods) {
        const absMod = [this.context.config.cwd, mod].join('/').replaceAll('\\', '/')

        if (resolvedMod?.includes(absMod) || resolvedMod === mod) {
          result.importMapValue = resolvedMod
          return true
        }
      }
    }

    return false
  }

  file = (results: ImportResult[]) => {
    return new FileMatcher(this.context, { importMap: this.value, value: results })
  }
}

const asArray = <T>(value: T | T[]) => (Array.isArray(value) ? value : [value])
