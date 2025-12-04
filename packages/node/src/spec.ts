import { logger } from '@pandacss/logger'
import type { ArtifactId, SpecType } from '@pandacss/types'
import picomatch from 'picomatch'
import type { PandaContext } from './create-context'

export const VALID_SPEC_TYPES: SpecType[] = [
  'tokens',
  'recipes',
  'patterns',
  'conditions',
  'keyframes',
  'semantic-tokens',
  'text-styles',
  'layer-styles',
  'animation-styles',
  'color-palette',
]

export const isValidSpecType = (value: unknown): value is SpecType => {
  return typeof value === 'string' && VALID_SPEC_TYPES.includes(value as SpecType)
}

export interface SpecOptions {
  outdir?: string
  filter?: string
}

export async function spec(ctx: PandaContext, options: SpecOptions) {
  const { outdir, filter } = options

  const specs = ctx.getSpec()
  const matcher = filter ? picomatch(filter) : null

  const filterContent = (content: any, specType: string) => {
    if (!matcher) return content
    const clone = { ...content }

    if (specType === 'color-palette') {
      // color-palette has a different structure: data.values is an array
      clone.data = {
        ...clone.data,
        values: clone.data.values.filter((v: string) => matcher(v)),
      }
    } else {
      // All other specs have data as an array of objects with a 'name' property
      clone.data = clone.data.filter((item: any) => matcher(item.name))
    }
    return clone
  }

  // Use ctx.paths.specs (includes configured outdir) or override with provided outdir
  const specDir = outdir ? [ctx.config.cwd, outdir] : ctx.paths.specs
  const specDirPath = ctx.runtime.path.join(...specDir)

  const writeSpec = async (name: string, content: any) => {
    const filteredContent = filterContent(content, name)

    await ctx.output.write({
      id: `spec-${name}` as ArtifactId,
      dir: specDir,
      files: [{ file: `${name}.json`, code: JSON.stringify(filteredContent, null, 2) }],
    })
  }

  await Promise.all(Object.entries(specs as Record<string, any>).map(([key, content]) => writeSpec(key, content)))

  const specTypes = Object.keys(specs as Record<string, any>)
  const typesList = specTypes.map((t) => `${t}.json`).join(', ')

  logger.info('spec', `Generated ${specTypes.length} spec file(s) → ${specDirPath}`)
  logger.info('spec', `  Types: ${typesList}`)

  return specs
}
