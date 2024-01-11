import { isString, mapEntries } from '@pandacss/shared'
import type { ImportMapInput, ImportMapOutput } from '@pandacss/types'
import type { Context } from './context'
import { FileMatcher, type ImportResult } from './file-matcher'

interface ImportMatcher {
  mod: string
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

    const importMap = mapEntries(this.normalize(context.config.importMap), (key, paths) => [key, paths.join('/')])

    this.matchers.css = this.createMatcher(importMap.css, ['css', 'cva', 'sva'])
    this.matchers.recipe = this.createMatcher(importMap.recipe)
    this.matchers.pattern = this.createMatcher(importMap.pattern)

    if (jsx.isEnabled) {
      this.matchers.jsx = this.createMatcher(importMap.jsx, jsx.names)
    }

    this.value = importMap
  }

  private fromString = (map: string): ImportMapOutput => {
    return {
      css: [map, 'css'],
      recipe: [map, 'recipes'],
      pattern: [map, 'patterns'],
      jsx: [map, 'jsx'],
    }
  }

  private fromInput = (map: ImportMapInput | undefined): ImportMapOutput => {
    const { css, recipes, patterns, jsx } = map ?? {}
    return {
      css: css ? [css] : [this.outdir, 'css'],
      recipe: recipes ? [recipes] : [this.outdir, 'recipes'],
      pattern: patterns ? [patterns] : [this.outdir, 'patterns'],
      jsx: jsx ? [jsx] : [this.outdir, 'jsx'],
    }
  }

  private getOutdir = () => {
    const compilerOptions = this.context.conf.tsconfig?.compilerOptions ?? {}
    const cwd = this.context.config.cwd

    const baseUrl = compilerOptions.baseUrl ?? ''
    const relativeBaseUrl = baseUrl !== cwd ? baseUrl.replace(cwd, '').slice(1) : cwd

    return this.context.config.outdir.replace(relativeBaseUrl, '')
  }

  normalize = (map: string | ImportMapInput | undefined): ImportMapOutput => {
    if (isString(map)) return this.fromString(map)
    return this.fromInput(map)
  }

  private createMatcher = (mod: string, values?: string[]): ImportMatcher => {
    const regex = values ? new RegExp(`^(${values.join('|')})$`) : /.*/
    const match = (value: string) => regex.test(value)
    return { mod, regex, match }
  }

  match = (result: ImportResult | undefined, resolveTsPath?: (mod: string) => string | undefined): boolean => {
    if (!result) return false

    for (const { regex, mod } of Object.values(this.matchers)) {
      // if none of the imported values match the regex, skip
      if (!regex.test(result.name)) continue

      // this checks that `yyy` contains {outdir}/{folder} in `import xxx from yyy`
      if (result.mod.includes(mod)) {
        return true
      }

      // that might be a TS path mapping, it could be completely different from the actual path
      const resolvedMod = resolveTsPath?.(result.mod)

      if (resolvedMod?.includes(mod)) {
        result.importMapValue = resolvedMod
        return true
      }
    }

    return false
  }

  file = (results: ImportResult[]) => {
    return new FileMatcher(this.context, { importMap: this.value, value: results })
  }
}
