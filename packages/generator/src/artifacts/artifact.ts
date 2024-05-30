import type { Context } from '@pandacss/core'
import type { ArtifactFileId, ArtifactId, Config, ConfigPath, Pretty } from '@pandacss/types'

type RawOrContextFn<T> = T | ((ctx: Context) => T)
type InferRaw<T> = T extends RawOrContextFn<infer R> ? R : T

type RemoveUnknowns<T> = {
  [K in keyof T as HasUnknown<T[K]> extends true ? never : K]: T[K]
}
type HasUnknown<T> = unknown extends T ? true : false

interface GenerateCodeParams<TDeps extends RawOrContextFn<ConfigPath[]>, TComputed> {
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
}

export type ArtifactImports = Partial<Record<ArtifactFileId, string[]>>

interface ArtifactOptions<TDeps extends RawOrContextFn<ConfigPath[]>, TComputed> {
  id: ArtifactFileId
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

export class ArtifactFile<TDeps extends RawOrContextFn<ConfigPath[]>, TComputed>
  implements ArtifactOptions<TDeps, TComputed>
{
  id: ArtifactFileId
  fileName: string
  type: ArtifactOptions<TDeps, TComputed>['type']
  dir: ArtifactOptions<TDeps, TComputed>['dir']
  dependencies: ArtifactOptions<TDeps, TComputed>['dependencies']
  imports: ArtifactOptions<TDeps, TComputed>['imports']
  computed?: ArtifactOptions<TDeps, TComputed>['computed']
  code: ArtifactOptions<TDeps, TComputed>['code']

  constructor(options: ArtifactOptions<TDeps, TComputed>) {
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

export interface ArtifactGroup {
  id: ArtifactId
  files: ArtifactFile<any, any>[]
}

export interface GeneratedArtifact {
  path: string[]
  content: string
}

export class ArtifactMap {
  private artifacts: Map<ArtifactId, ArtifactGroup> = new Map()
  private files: Map<ArtifactFileId, ArtifactFile<any, any>> = new Map()

  addGroup(artifact: ArtifactGroup) {
    this.artifacts.set(artifact.id, artifact)
    artifact.files.forEach((file) => this.files.set(file.id, file))
    return this
  }

  getGroup(id: ArtifactId) {
    return this.artifacts.get(id)
  }

  addFile(artifact: ArtifactFile<any, any>) {
    this.files.set(artifact.id, artifact)
    return this
  }

  getFile(id: ArtifactFileId) {
    return this.files.get(id)
  }

  filter(ids: ArtifactFileId[]) {
    return Array.from(this.files.values()).filter((node) => ids.includes(node.id))
  }

  generate(ctx: Context, ids: ArtifactFileId[] | undefined) {
    const stack = ids ? this.filter(ids) : Array.from(this.files.values())
    const seen = new Set<ArtifactFileId>()
    const contents = [] as Array<GeneratedArtifact>

    while (stack.length) {
      const node = stack.pop()!
      seen.add(node.id)

      const dependencies = callable(ctx, node.dependencies as RawOrContextFn<ConfigPath[]>)
      const code = node.code?.({
        dependencies: dependencies.map((dep) => (ctx as any)[dep] || (ctx.config as any)[dep]),
        computed: callable(ctx, node.computed),
      })
      if (!code) return

      const computedId = callable(ctx, node.dir)
      const fileWithExt = node.type === 'js' ? ctx.file.ext(node.fileName) : ctx.file.extDts(node.fileName)

      let content = code
      if (node.type === 'dts') {
        content = `/* eslint-disable */\n${code}`
      }

      contents.push({
        path: [...(Array.isArray(computedId) ? computedId : [computedId]), fileWithExt],
        content,
      })

      const imports = callable(ctx, node.imports)
      if (imports) {
        Object.keys(imports).forEach((key) => {
          const importedFileId = key as ArtifactFileId
          const depNode = this.getFile(importedFileId)
          if (depNode && !seen.has(importedFileId)) {
            seen.add(importedFileId)
            stack.push(depNode)
          }
        })
      }
    }

    return contents
  }
}

const callable = <T>(context: Context, value: RawOrContextFn<T>): InferRaw<T> =>
  typeof value === 'function' ? (value as any)(context) : value
