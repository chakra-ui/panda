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

interface ArtifactOptions<TDeps extends RawOrContextFn<ConfigPath[]>, TComputed> {
  id: ArtifactFileId
  fileName: string
  type: 'js' | 'dts'
  dir: RawOrContextFn<string | string[]>
  dependencies: TDeps
  imports?: RawOrContextFn<Partial<Record<ArtifactFileId, string[]>>>
  importsType?: RawOrContextFn<Partial<Record<ArtifactFileId, string[]>>>
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

// class Artifact {
//     constructor (public id: ArtifactId, public files: ArtifactFile<any, any>[]) {
//     }
// }

interface Artifact {
  id: ArtifactId
  files: ArtifactFile<any, any>[]
}

interface GeneratedArtifact {
  path: string[]
  content: string
}

export class ArtifactGraph {
  private nodes: Map<ArtifactId, Artifact> = new Map()

  add(artifact: Artifact) {
    this.nodes.set(artifact.id, artifact)
  }

  get(name: ArtifactId) {
    return this.nodes.get(name)
  }

  filter(ids: ArtifactId[]) {
    return Array.from(this.nodes.values()).filter((node) => ids.includes(node.id))
  }

  generate(ctx: Context, ids: ArtifactId[] | undefined) {
    const stack = ids ? this.filter(ids) : Array.from(this.nodes.values())
    const seen = new Set<ArtifactId>()
    const contents = [] as Array<GeneratedArtifact>

    while (stack.length) {
      const artifact = stack.pop()!
      seen.add(artifact.id)

      artifact.files.forEach((node) => {
        const dependencies = callable(ctx, node.dependencies as RawOrContextFn<ConfigPath[]>)
        const code = node.code?.({
          dependencies: dependencies.map((dep) => (ctx as any)[dep] || (ctx.config as any)[dep]),
          computed: callable(ctx, node.computed),
        })
        if (!code) return

        const computedId = callable(ctx, node.dir)
        const fileWithExt = node.type === 'js' ? ctx.file.ext(node.fileName) : ctx.file.extDts(node.fileName)

        contents.push({
          path: [...(Array.isArray(computedId) ? computedId : [computedId]), fileWithExt],
          content: code,
        })

        const imports = callable(ctx, node.imports)
        if (imports) {
          Object.keys(imports).forEach((key) => {
            const importedArtifactId = key as ArtifactId
            const depNode = this.get(importedArtifactId)
            if (depNode && !seen.has(importedArtifactId)) {
              seen.add(importedArtifactId)
              stack.push(depNode)
            }
          })
        }
      })
    }

    return contents
  }
}

const callable = <T>(context: Context, value: RawOrContextFn<T>): InferRaw<T> =>
  typeof value === 'function' ? (value as any)(context) : value
