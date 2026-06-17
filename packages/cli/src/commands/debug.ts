import { defineCommand } from 'citty'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { parseCliFlags, runtimeArgs } from '../args'
import { runCommand } from '../run-command'
import { debugFlagsSchema } from '../schema'
import { diagnosticsPass, normalizeDiagnostics, type CliDiagnostic } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { DebugFlags, DebugResult } from '../schema'

export const debugCommand = defineCommand({
  meta: {
    name: 'debug',
    description: 'Dump resolved config and per-file extraction for bug reports',
  },
  args: () => ({
    ...runtimeArgs(),
    outdir: { type: 'string', description: 'Debug output directory (used as-is; default <styled-system>/debug)' },
    dry: { type: 'boolean', description: 'Print the dump to stdout instead of writing files' },
    onlyConfig: { type: 'boolean', description: 'Only dump the resolved config, skip per-file extraction' },
  }),
  run: async ({ args }) => setExitCode(await runDebug(parseCliFlags(debugFlagsSchema, args))),
})

export async function runDebug(flags: DebugFlags = {}, output: OutputSink = consoleOutput): Promise<DebugResult> {
  return runCommand({
    command: 'debug',
    flags,
    output,
    failData: () => ({ files: [], sourceCount: 0 }),
    async execute(ctx) {
      const { driver, cwd } = ctx
      const outdir = flags.outdir ? driver.resolvePath(flags.outdir) : join(driver.paths().root, 'debug')
      const sources = driver.scan()

      const dump: Record<string, string> = {
        'system-info.json': JSON.stringify(
          {
            platform: process.platform,
            arch: process.arch,
            node: process.version,
            configPath: driver.configPath ?? null,
            sourceCount: sources.length,
          },
          null,
          2,
        ),
        'config.json': JSON.stringify(driver.config, null, 2),
      }

      const fileDiagnostics: CliDiagnostic[] = []

      if (!flags.onlyConfig) {
        for (const source of sources) {
          // A debug dump should survive a broken project: capture a read/extract failure as a diagnostic
          // and write the error into the per-file slot instead of aborting the whole command.
          try {
            const code = readFileSync(source, 'utf8')
            const result = driver.compiler.extractFileSource(source, code)
            fileDiagnostics.push(...normalizeDiagnostics(result.diagnostics, { cwd, file: source }))
            dump[`${safeName(cwd, source)}.extract.json`] = JSON.stringify(result, null, 2)
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            fileDiagnostics.push(
              ...normalizeDiagnostics(
                [{ code: 'debug_extract_error', severity: 'error', message, category: 'debug' }],
                { cwd, file: source },
              ),
            )
            dump[`${safeName(cwd, source)}.extract.json`] = JSON.stringify({ error: message }, null, 2)
          }
        }

        // v2 emits atomic CSS at the project level (atoms dedupe across files), so the dump carries the
        // whole-project stylesheet once rather than a per-file slice. Parse populates project state first.
        driver.parseFiles()
        dump['styles.css'] = driver.cssgen().css
      }

      const diagnostics = normalizeDiagnostics(
        [...normalizeDiagnostics(driver.compiler.diagnostics(), { cwd }), ...fileDiagnostics],
        { cwd },
      )

      const files = flags.dry ? writeDryDump(ctx.output, dump) : writeDiskDump(outdir, dump)

      if (shouldPrintHumanSummary(flags)) {
        ctx.output.log(
          flags.dry
            ? `debug: ${Object.keys(dump).length} files (dry run)`
            : `debug: wrote ${files.length} files to ${outdir}`,
        )
      }

      return {
        data: { outdir: flags.dry ? undefined : outdir, files, sourceCount: sources.length },
        diagnostics,
        ok: diagnosticsPass(diagnostics, flags.maxWarnings),
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
    },
  }) as Promise<DebugResult>
}

function writeDiskDump(outdir: string, dump: Record<string, string>): string[] {
  return Object.entries(dump).map(([name, content]) => {
    const target = join(outdir, name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
    return target
  })
}

function writeDryDump(output: OutputSink, dump: Record<string, string>): string[] {
  for (const [name, content] of Object.entries(dump)) {
    output.log(`--- ${name} ---\n${content}`)
  }
  return Object.keys(dump)
}

// Flatten a source path into a single filename, e.g. `src/App.tsx` -> `src__App.tsx`.
function safeName(cwd: string, file: string): string {
  return relative(cwd, file).replace(/[\\/]/g, '__')
}
