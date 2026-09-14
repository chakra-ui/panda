import { defineCommand } from 'citty'
import { baseArgs, outputArgs, parseCliFlags, traceArgs } from '../args'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { runCommand } from '../run-command'
import { specFlagsSchema, type SpecFlags, type SpecResult } from '../schema'
import { time } from '../timing'

export const specCommand = defineCommand({
  meta: {
    name: 'spec',
    description: 'Generate a versioned design-system spec',
  },
  args: () => ({
    ...baseArgs(),
    outdir: {
      type: 'string',
      description: "Output directory (default '<styled-system>/specs')",
      alias: 'o',
    },
    minify: { type: 'boolean', description: 'Minify the generated JSON', alias: 'm' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runSpec(parseCliFlags(specFlagsSchema, args))),
})

export async function runSpec(flags: SpecFlags = {}, output: OutputSink = consoleOutput): Promise<SpecResult> {
  return runCommand({
    command: 'spec',
    flags,
    output,
    failData: () => ({ outfile: undefined, bytes: 0 }),
    async execute({ driver, cwd, timings }) {
      const outdir = flags.outdir
        ? driver.resolvePath(flags.outdir)
        : driver.compiler.path.join([driver.paths().root, 'specs'])
      const serialized = time({
        timings,
        phase: 'spec',
        run: () => `${JSON.stringify(driver.compiler.spec(), null, flags.minify ? 0 : 2)}\n`,
      })
      const [outfile] = time({
        timings,
        phase: 'write',
        run: () =>
          driver.compiler.writeArtifacts({
            outdir,
            cwd,
            artifacts: [
              {
                id: 'spec',
                files: [{ path: 'spec.json', code: serialized, dependencies: [] }],
              },
            ],
          }),
      })

      return {
        data: {
          outfile,
          bytes: Buffer.byteLength(serialized),
        },
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
      if (result.ok && shouldPrintHumanSummary(flags)) {
        ctx.output.log(`spec: ${result.bytes} bytes → ${result.outfile}`)
      }
    },
  }) as Promise<SpecResult>
}
