import type { Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import { bundleChunks, emitArtifacts, writeFileChunk } from './extract'
import { watchFiles } from './watch-files'

export async function generate(config: Config, configPath?: string) {
  return watchFiles(config, {
    configPath,
    onFileEvent(event, file, ctx) {
      const {
        runtime: { path },
        config: { cwd },
      } = ctx

      match(event)
        .with('unlink', () => {
          ctx.project.removeSourceFile(path.abs(cwd, file))
          ctx.chunks.rm(file)
        })
        .with('change', async () => {
          ctx.project.reloadSourceFile(file)
          await writeFileChunk(ctx, file)
          return bundleChunks(ctx)
        })
        .with('add', async () => {
          ctx.project.createSourceFile(file)
          return bundleChunks(ctx)
        })
        .otherwise(() => {
          // noop
        })
    },
  })
}

export async function generateArtifacts(config: Config, configPath?: string) {
  return watchFiles(config, {
    configPath,
    onFileEvent(event, file, ctx) {
      const {
        runtime: { path },
        config: { cwd },
      } = ctx

      match(event)
        .with('unlink', () => {
          ctx.project.removeSourceFile(path.abs(cwd, file))
          ctx.chunks.rm(file)
        })
        .with('change', async () => {
          ctx.project.reloadSourceFile(file)
          return emitArtifacts(ctx)
        })
        .with('add', async () => {
          ctx.project.createSourceFile(file)
          return emitArtifacts(ctx)
        })
        .otherwise(() => {
          // noop
        })
    },
  })
}
