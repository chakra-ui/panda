import type { Context, FileEngine } from '@pandacss/core'
import type { ArtifactFileId, ArtifactId, Config, ConfigPath, DiffConfigResult, Pretty } from '@pandacss/types'

type RawOrContextFn<T> = T | ((ctx: Context) => T)
type InferRaw<T> = T extends RawOrContextFn<infer R> ? R : T

type RemoveUnknowns<T> = {
  [K in keyof T as HasUnknown<T[K]> extends true ? never : K]: T[K]
}
type HasUnknown<T> = unknown extends T ? true : false

export interface GenerateCodeParams<TDeps extends RawOrContextFn<ConfigPath[]>, TComputed> {
  dependencies: Pretty<
    RemoveUnknowns<{
      [Key in InferRaw<TDeps>[number]]: Key extends keyof Context & keyof Config
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

export interface ArtifactOptions<
  TFileId extends ArtifactFileId,
  TDeps extends RawOrContextFn<ConfigPath[]>,
  TComputed,
> {
  id: TFileId
  fileName: string
  /**
   * Will be used to pick the right file extension
   * for 'js': depending on `config.outExtension` it can be `.js` or `.mjs`
   * for 'dts': depending on `config.forceConsistentTypeExtension` it can be `.d.ts` or `.d.mts`
   */
  type: 'js' | 'dts' | 'json'
  dir: RawOrContextFn<string | string[]>
  /**
   * List of config paths that will be used (at some point) to compute the artifact
   * When using a path that exists in both the config AND also in the `Context`
   * the value/typing will be the one from the `Context`
   */
  dependencies: TDeps
  imports?: RawOrContextFn<undefined | ArtifactImports>
  importsType?: RawOrContextFn<undefined | ArtifactImports>
  computed?: (ctx: Context) => TComputed
  code: (params: GenerateCodeParams<TDeps, TComputed>) => string | undefined
}

export class ArtifactFile<
  TFileId extends ArtifactFileId,
  TDeps extends RawOrContextFn<ConfigPath[]> = RawOrContextFn<ConfigPath[]>,
  TComputed = any,
> implements ArtifactOptions<TFileId, TDeps, TComputed>
{
  id: TFileId
  fileName: string
  type: ArtifactOptions<TFileId, TDeps, TComputed>['type']
  dir: ArtifactOptions<TFileId, TDeps, TComputed>['dir']
  dependencies: ArtifactOptions<TFileId, TDeps, TComputed>['dependencies']
  imports: ArtifactOptions<TFileId, TDeps, TComputed>['imports']
  computed?: ArtifactOptions<TFileId, TDeps, TComputed>['computed']
  code: ArtifactOptions<TFileId, TDeps, TComputed>['code']

  constructor(options: ArtifactOptions<TFileId, TDeps, TComputed>) {
    this.id = options.id
    this.fileName = options.fileName
    this.type = options.type
    this.dir = options.dir
    this.dependencies = options.dependencies
    this.imports = options.imports
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
type MergeFiles<TSource, TTarget> = TSource & TTarget
export type MergeArtifactMaps<TSource extends ArtifactMap<any>, TTarget extends ArtifactMap<any>> = ArtifactMap<
  Pretty<TSource['zzz_internal_type'] & TTarget['zzz_internal_type']>
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

/**
 * trick to combine multiple unions of objects into a single object
 * only works with objects not primitives
 * @param union - Union of objects
 * @returns Intersection of objects
 */
export type UnionToIntersection<union> = (union extends any ? (k: union) => void : never) extends (
  k: infer intersection,
) => void
  ? intersection
  : never

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

  private createMatchers(ctx: Context) {
    const matchers = [] as Array<ReturnType<typeof createMatcher>>
    this.files.forEach((file) => {
      matchers.push(createMatcher(file.id, callable(ctx, file.dependencies)))
    })

    return matchers
  }

  computeChangedFiles(ctx: Context, diffResult?: DiffConfigResult) {
    if (!diffResult) return new Set(this.files.keys())

    const matchers = this.createMatchers(ctx)
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

  getCodeParams(ctx: Context, node: ArtifactFile<any, any, any>) {
    const dependencies = callable(ctx, node.dependencies as RawOrContextFn<ConfigPath[]>)
    return {
      dependencies: Object.fromEntries(
        // Get dependency from context if it exists, fallback to config otherwise
        dependencies.map((dep) => [dep, (ctx as any)[dep] || (ctx.config as any)[dep]]),
      ) as any,
      computed: callable(ctx, node.computed),
      file: ctx.file,
    }
  }

  private getFileName(ctx: Context, node: ArtifactFile<any, any, any>) {
    if (node.type === 'js') return ctx.file.ext(node.fileName)
    if (node.type === 'dts') return ctx.file.extDts(node.fileName)

    return node.fileName
  }

  generate(ctx: Context, ids?: ArtifactFileId[]) {
    const stack = this.filter(ids)
    const seen = new Set<ArtifactFileId>()
    const contents = [] as Array<GeneratedArtifact<keyof TFiles>>

    while (stack.length) {
      const node = stack.pop()!
      if (seen.has(node.id)) continue

      seen.add(node.id)

      const code = node.code?.(this.getCodeParams(ctx, node))
      if (!code) continue

      const computedId = callable(ctx, node.dir)
      const fileWithExt = this.getFileName(ctx, node)

      let content = code
      if (node.type === 'dts') {
        content = `/* eslint-disable */\n${code}`
      }

      contents.push({
        id: node.id as keyof TFiles,
        path: [...(Array.isArray(computedId) ? computedId : [computedId]), fileWithExt],
        content,
      })

      const imports = callable(ctx, node.imports)
      if (imports) {
        Object.keys(imports).forEach((key) => {
          const importedFileId = key as ArtifactFileId
          const depNode = this.getFile(importedFileId as keyof TFiles)
          if (depNode && !seen.has(importedFileId)) {
            stack.push(depNode as any)
          }
        })
      }
    }

    return contents
  }
}

const callable = <T>(context: Context, value: RawOrContextFn<T>): InferRaw<T> =>
  typeof value === 'function' ? (value as any)(context) : value
