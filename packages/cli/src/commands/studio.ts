import { defineCommand } from 'citty'
import { sealSpec } from '@pandacss/compiler-shared'
import { parseCliFlags, runtimeArgs } from '../args'
import { runCommand } from '../run-command'
import {
  consoleOutput,
  renderCommandDiagnostics,
  shouldPrintHumanSummary,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { setExitCode } from '../result'
import { openUrl } from '../open-url'
import { studioFlagsSchema, type StudioFlags, type StudioResult } from '../schema'

const STUDIO_URL = 'https://studio.panda-css.com'

export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Open your design system in Panda Studio',
  },
  args: () => ({
    ...runtimeArgs(),
    open: {
      type: 'boolean',
      default: true,
      description: 'Open the studio in your browser',
      negativeDescription: 'Print the link without opening a browser',
    },
  }),
  run: async ({ args, rawArgs }) => setExitCode(await runStudio(parseCliFlags(studioFlagsSchema, args, rawArgs))),
})

export async function runStudio(
  flags: StudioFlags = {},
  output: OutputSink = consoleOutput,
  open: (url: string) => void = openUrl,
): Promise<StudioResult> {
  const studioUrl = process.env.PANDA_STUDIO_URL ?? STUDIO_URL

  return runCommand<StudioFlags, Pick<StudioResult, 'url' | 'files' | 'error'>>({
    command: 'studio',
    flags,
    output,
    trackSources: true,
    failData: () => ({ files: [] }),
    async execute({ driver }) {
      const json = driver.specJson()
      if (!json) {
        return {
          data: { files: [], error: 'nothing to show, your config has no tokens (add a preset or theme tokens)' },
          ok: false,
        }
      }

      try {
        const url = await upload(studioUrl, json)
        if (flags.open !== false && !shouldPrintJson(flags)) open(url)
        return { data: { url, files: [] } }
      } catch (error) {
        const reason =
          error instanceof UploadRejected
            ? `${studioUrl} rejected the upload (${error.message})`
            : `couldn't reach ${studioUrl}`
        return { data: { files: driver.spec(), error: reason }, ok: false }
      }
    },
    renderHuman(ctx, result) {
      if (result.diagnostics.length > 0) renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
      if (!shouldPrintHumanSummary(flags)) return
      if (result.url) {
        ctx.output.log(`studio: ${result.url}`)
        return
      }
      if (!result.error) return
      const lines = [`studio: ${result.error}`]
      if (result.files.length) lines.push(`wrote ${result.files[0]}`, `drop it on ${studioUrl} to view it`)
      ctx.output.log(lines.join('\n'))
    },
  }) as Promise<StudioResult>
}

class UploadRejected extends Error {}

async function upload(studioUrl: string, json: string): Promise<string> {
  const { sealed, key } = await sealSpec(json)
  const res = await fetch(new URL('/api/handoff', studioUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sealed),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new UploadRejected(`${res.status} ${res.statusText}`)
  const { id } = (await res.json()) as { id?: unknown }
  if (typeof id !== 'string') throw new UploadRejected(`${res.status} invalid response`)
  return `${new URL(`/view?h=${encodeURIComponent(id)}`, studioUrl)}#k=${key}`
}
