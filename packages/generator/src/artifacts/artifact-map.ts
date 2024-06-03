import type { Context, FileEngine } from '@pandacss/core'
import type { ArtifactFileId, Config, ConfigPath, DiffConfigResult, Pretty } from '@pandacss/types'

type RawOrFn<Input, T> = T | ((input: Input) => T)
type InferRawInput<Input, T> = T extends RawOrFn<Input, infer R> ? R : T

type RawOrContextFn<T> = RawOrFn<Context, T>
type Diffs = DiffConfigResult['diffs']
type ConfigPathsOrDiffsFn = RawOrFn<Diffs, ConfigPath[]>

type RemoveUnknowns<T> = {
  [K in keyof T as HasUnknown<T[K]> extends true ? never : K]: T[K]
}
type HasUnknown<T> = unknown extends T ? true : false

export interface GenerateCodeParams<TDeps extends ConfigPathsOrDiffsFn, TComputed> {
  dependencies: Pretty<
    RemoveUnknowns<{
      [Key in InferRawInput<Diffs, TDeps>[number]]: Key extends keyof Context & keyof Config
        ? Context[Key]
        : Key extends keyof Config
          ? Exclude<Config[Key], undefined>
          : unknown
    }>
  >
  computed: TComputed
  file: FileEngine
}

export type ArtifactImports = Partial<Record<ArtifactFileId, string[]>>

export interface ArtifactOptions<TFileId extends ArtifactFileId, TDeps extends ConfigPathsOrDiffsFn, TComputed> {
  id: TFileId
  fileName: string
  /**
   * Will be used to pick the right file extension
   * for 'js': depending on `config.outExtension` it can be `.js` or `.mjs`
   * for 'dts': depending on `config.forceConsistentTypeExtension` it can be `.d.ts` or `.d.mts`
   */
  type: 'js' | 'dts' | 'json'
  dir: RawOrContextFn<string[]>
  /**
   * List of config paths that will be used (at some point) to compute the artifact
   * When using a path that exists in both the config AND also in the `Context`
   * the value/typing will be the one from the `Context`
   */
  dependencies: TDeps
  imports?: RawOrContextFn<ArtifactImports>
  importsType?: RawOrContextFn<ArtifactImports>
  computed?: (ctx: Context) => TComputed
  code: (params: GenerateCodeParams<TDeps, TComputed>) => string | undefined
}

export class ArtifactFile<
  TFileId extends ArtifactFileId,
  TDeps extends ConfigPathsOrDiffsFn = ConfigPathsOrDiffsFn,
  TComputed = any,
> implements ArtifactOptions<TFileId, TDeps, TComputed>
{
  id: TFileId
  fileName: string
  type: ArtifactOptions<TFileId, TDeps, TComputed>['type']
  dir: ArtifactOptions<TFileId, TDeps, TComputed>['dir']
  dependencies: ArtifactOptions<TFileId, TDeps, TComputed>['dependencies']
  imports: ArtifactOptions<TFileId, TDeps, TComputed>['imports']
  importsType: ArtifactOptions<TFileId, TDeps, TComputed>['importsType']
  computed?: ArtifactOptions<TFileId, TDeps, TComputed>['computed']
  code: ArtifactOptions<TFileId, TDeps, TComputed>['code']

  constructor(options: ArtifactOptions<TFileId, TDeps, TComputed>) {
    this.id = options.id
    this.fileName = options.fileName
    this.type = options.type
    this.dir = options.dir
    this.dependencies = options.dependencies
    this.imports = options.imports
    this.importsType = options.importsType
    this.computed = options.computed
    this.code = options.code
  }
}

/**
 * Acts like a .gitignore matcher
 * e.g a list of string to search for nested path with glob and exclusion allowed
 * ["outdir", "theme.recipes", '*.css', '!aaa.*.bbb']
 */
function createMatcher(id: string, patterns: string[]) {
  if (!patterns?.length) return () => undefined

  const includePatterns = [] as string[]
  const excludePatterns = [] as string[]
  const deduped = new Set(patterns)

  // Separate inclusion and exclusion patterns
  deduped.forEach((pattern) => {
    // replace '*' with '.*' for regex matching
    const regexString = pattern.replace(/\*/g, '.*')
    if (pattern.startsWith('!')) {
      excludePatterns.push(regexString.slice(1))
    } else {
      includePatterns.push(regexString)
    }
  })

  const include = new RegExp(includePatterns.join('|'))
  const exclude = new RegExp(excludePatterns.join('|'))

  return (path: string) => {
    if (excludePatterns.length && exclude.test(path)) return
    return include.test(path) ? id : undefined
  }
}

export interface GeneratedArtifact<TFileId> {
  id: TFileId
  path: string[]
  content: string
}

type ExtendFiles<TFiles, T extends ArtifactFile<any>> = Pretty<TFiles & { [K in T['id']]: T }>
type MergeFiles<TCurrent, TMerged> = TCurrent & TMerged

export type MergeArtifactMaps<TCurrent extends ArtifactMap<any>, TMerged extends ArtifactMap<any>> = ArtifactMap<
  Pretty<TCurrent['zzz_internal_type'] & TMerged['zzz_internal_type']>
>

type InferMapTypeFromRecord<TFiles> = Map<
  keyof TFiles,
  {
    [K in keyof TFiles]: K extends ArtifactFileId
      ? TFiles[K] extends ArtifactFile<K, infer TDeps, infer TComputed>
        ? ArtifactFile<K, TDeps, TComputed>
        : never
      : never
  }[keyof TFiles]
>

export interface GenerateArtifactOptions {
  ids?: ArtifactFileId[]
  diffs?: DiffConfigResult['diffs']
}

export class ArtifactMap<TFiles> {
  private files: InferMapTypeFromRecord<TFiles> = new Map()
  zzz_internal_type!: TFiles

  addFile<T extends ArtifactFile<any>>(artifact: T): ArtifactMap<ExtendFiles<TFiles, T>> {
    this.files.set(artifact.id, artifact as any)
    return this as ArtifactMap<ExtendFiles<TFiles, T>>
  }

  getFile<TFileId extends keyof TFiles>(id: TFileId) {
    return this.files.get(id) as TFiles[TFileId]
  }

  filter(ids?: ArtifactFileId[]) {
    return ids
      ? Array.from(this.files.values()).filter((node) => ids.includes(node.id))
      : Array.from(this.files.values())
  }

  merge<TTarget>(artifacts: ArtifactMap<TTarget>) {
    artifacts.files.forEach((artifact, id) => {
      this.files.set(id as any, artifact as any)
    })
    return this as ArtifactMap<Pretty<MergeFiles<TFiles, TTarget>>>
  }

  private createMatchers(diffs?: DiffConfigResult['diffs']) {
    const matchers = [] as Array<ReturnType<typeof createMatcher>>
    this.files.forEach((file) => {
      matchers.push(createMatcher(file.id, callable(diffs ?? [], file.dependencies)))
    })

    return matchers
  }

  computeChangedFiles(ctx: Context, diffResult?: DiffConfigResult) {
    if (!diffResult) return new Set(this.files.keys())

    const matchers = this.createMatchers(diffResult.diffs)
    const changed = new Set<keyof TFiles>()

    diffResult.diffs.forEach((change) => {
      const changePath = change.path.join('.')

      matchers.forEach((matcher) => {
        const id = matcher(changePath) as keyof TFiles | undefined
        if (!id) return

        changed.add(id)
      })
    })

    return changed
  }

  getCodeParams(ctx: Context, node: ArtifactFile<any>, diffs?: DiffConfigResult['diffs']) {
    const dependencies = callable(diffs ?? [], node.dependencies)
    return {
      dependencies: Object.fromEntries(
        // Get dependency from context if it exists, fallback to config otherwise
        dependencies.map((dep) => [dep, (ctx as any)[dep] || (ctx.config as any)[dep]]),
      ) as any,
      computed: callable(ctx, node.computed),
      file: ctx.file,
    }
  }

  private getFileName(ctx: Context, node: ArtifactFile<any>) {
    if (node.type === 'js') return ctx.file.ext(node.fileName)
    if (node.type === 'dts') return ctx.file.extDts(node.fileName)

    return node.fileName
  }

  generate(ctx: Context, { ids, diffs }: GenerateArtifactOptions = {}) {
    const stack = this.filter(ids)
    const seen = new Set<ArtifactFileId>()
    const contents = [] as Array<GeneratedArtifact<keyof TFiles>>

    while (stack.length) {
      const node = stack.pop()!
      if (seen.has(node.id)) continue

      seen.add(node.id)

      const code = node.code?.(this.getCodeParams(ctx, node, diffs))
      if (!code) continue

      const dir = callable(ctx, node.dir)
      const artifactDir = dir
        .join('/')
        .replace(ctx.config.cwd, '')
        .replace(ctx.config.outdir, '')
        .split('/')
        .filter(Boolean)

      let content = code
      // Add sorted imports to the top of the file, relative to the current file
      if (node.imports || node.importsType) {
        const imports = Object.entries(callable(ctx, node.imports ?? {})).map(([from, imports]) => [
          from,
          `import { ${imports.sort().join(', ')} } from '${ctx.file.ext(relative(artifactDir, from))}'`,
        ])
        const importTypes = Object.entries(callable(ctx, node.importsType ?? {})).map(([from, imports]) => [
          from,
          `import type { ${imports.sort().join(', ')} } from '${ctx.file.extDts(relative(artifactDir, from))}'`,
        ])

        const allImports = [...imports, ...importTypes]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([_from, imports]) => imports)
        content = `${allImports.join('\n')}\n${content}`

        // Disable transitive imports generation on HMR
        if (!diffs) {
          ;[...imports, ...importTypes].forEach((key) => {
            const importedFileId = key[0] as ArtifactFileId
            const depNode = this.getFile(importedFileId as keyof TFiles)
            if (depNode && !seen.has(importedFileId)) {
              stack.push(depNode as any)
            }
          })
        }
      }

      if (node.type === 'dts') {
        content = `/* eslint-disable */\n${content}`
      }
      if (node.id === 'types/global.d.ts') {
        content = `// @ts-nocheck\n${content}`
      }

      const fileWithExt = this.getFileName(ctx, node)
      contents.push({
        id: node.id as keyof TFiles,
        path: [...dir, fileWithExt],
        content,
      })
    }

    return contents
  }
}

const callable = <Input, T>(input: Input, value: RawOrFn<Input, T>): InferRawInput<Input, T> =>
  typeof value === 'function' ? (value as any)(input) : value

const relative = (current: string[], moduleSpecifier: string) => {
  const from = moduleSpecifier.split('.')[0].split('/')

  // Find the common base path
  let i = 0
  while (i < current.length && i < from.length && current[i] === from[i]) {
    i++
  }

  const upPaths = Array(current.length - i).fill('..')
  const downPaths = from.slice(i)
  const relativePath = [...upPaths, ...downPaths].join('/')

  if (!relativePath) {
    return './'
  }

  if (relativePath.startsWith('../')) {
    return relativePath
  }

  return './' + relativePath
}
