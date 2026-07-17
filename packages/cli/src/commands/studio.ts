import { defineCommand } from 'citty'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { baseArgs, outputArgs, parseCliFlags, traceArgs } from '../args'
import { consoleOutput, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { runCommand } from '../run-command'
import { studioGenerateFlagsSchema, studioServeFlagsSchema } from '../schema'
import type { StudioGenerateFlags, StudioGenerateResult, StudioServeFlags, StudioServeResult } from '../schema'
import { serveStudio, type StudioServer } from '../studio-server'
import { buildTokensSnapshot, viewFiles, viewerFiles, type StudioFile, type StudioFramework } from '../studio-codegen'

export const studioGenerateCommand = defineCommand({
  meta: {
    name: 'studio generate',
    description: 'Write token view components for your design system',
  },
  args: () => ({
    ...baseArgs(),
    outdir: { type: 'string', description: "Output directory for the views (default '<outdir>/studio')" },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runStudioGenerate(parseCliFlags(studioGenerateFlagsSchema, args))),
})

export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Boot a live token viewer. Run `panda studio generate` to emit token views into your project',
  },
  args: () => ({
    ...baseArgs(),
    port: { type: 'string', description: 'Port for the live viewer server' },
    host: { type: 'string', description: 'Host for the live viewer server' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runStudioServe(parseCliFlags(studioServeFlagsSchema, args))),
})

export async function runStudioGenerate(
  flags: StudioGenerateFlags = {},
  output: OutputSink = consoleOutput,
): Promise<StudioGenerateResult> {
  return (await runCommand({
    command: 'studio',
    flags,
    output,
    failData: () => ({ files: [], framework: 'react' as StudioFramework }),
    async execute(ctx) {
      const framework = resolveFramework(ctx.driver.config.jsxFramework)
      const tokens = buildTokensSnapshot(ctx.driver.compiler.spec())
      const outdir = flags.outdir ? ctx.driver.resolvePath(flags.outdir) : join(ctx.driver.getOutdir(), 'studio')

      const files = writeStudioFiles(outdir, viewFiles(tokens, framework))

      if (shouldPrintHumanSummary(flags)) {
        ctx.output.log(`studio: wrote ${files.length} ${framework} files to ${outdir}`)
      }

      return { data: { outdir, files, framework } }
    },
  })) as StudioGenerateResult
}

export async function runStudioServe(
  flags: StudioServeFlags = {},
  output: OutputSink = consoleOutput,
): Promise<StudioServeResult> {
  let server: StudioServer | undefined

  const result = (await runCommand({
    command: 'studio',
    flags,
    output,
    keepTracing: true,
    failData: () => ({}),
    async execute(ctx) {
      const tokens = buildTokensSnapshot(ctx.driver.compiler.spec())
      const dir = mkdtempSync(join(tmpdir(), 'panda-studio-'))
      writeStudioFiles(dir, viewerFiles(tokens))

      server = await serveStudio(dir, { port: flags.port, host: flags.host })

      if (shouldPrintHumanSummary(flags)) {
        ctx.output.log(`studio: viewer running at ${server.url}`)
      }

      return { data: { url: server.url } }
    },
  })) as StudioServeResult

  const stopTracing = result.stop
  result.stop = async () => {
    await server?.close()
    await stopTracing?.()
  }

  return result
}

function resolveFramework(jsxFramework: unknown): StudioFramework {
  return jsxFramework === 'solid' ? 'solid' : 'react'
}

function writeStudioFiles(outdir: string, files: StudioFile[]): string[] {
  return files.map((file) => {
    const path = join(outdir, file.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, file.code)
    return path
  })
}
