import { defineCommand } from 'citty'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { baseArgs, outputArgs, parseCliFlags, traceArgs } from '../args'
import { consoleOutput, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { runCommand } from '../run-command'
import { studioServeFlagsSchema } from '../schema'
import type { StudioServeFlags, StudioServeResult } from '../schema'
import { serveStudio, type StudioServer } from '../studio-server'
import { buildTokensSnapshot, createStudioRuntime, semanticMapFromTokens, studioArtifactFiles } from '../studio-core'

export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Emit styled-system/studio and boot a live token viewer',
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

function studioPage(body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Panda Studio</title>
  </head>
  <body>${body}</body>
</html>
`
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
      const spec = ctx.driver.compiler.spec()
      const tokens = buildTokensSnapshot(spec, semanticMapFromTokens(ctx.driver.compiler.semanticTokens() ?? []))
      const outdir = ctx.driver.getOutdir()

      for (const file of studioArtifactFiles(tokens)) {
        const path = join(outdir, file.path)
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, file.code)
      }

      const { getTokenHtml } = createStudioRuntime(tokens)
      const dir = mkdtempSync(join(tmpdir(), 'panda-studio-'))
      writeFileSync(join(dir, 'index.html'), studioPage(getTokenHtml()))
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
