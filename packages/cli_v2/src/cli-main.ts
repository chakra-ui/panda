import { defineCommand, runMain } from 'citty'
import { runCodegen, runCssgen, runInspect, type CodegenFlags, type CssgenFlags, type InspectFlags } from './index'

export async function main(argv = process.argv): Promise<void> {
  const cwd = process.cwd()
  const mainCommand = defineCommand({
    meta: {
      name: 'panda',
      description: 'Experimental v2 CLI for the Panda Rust compiler',
    },
    subCommands: {
      codegen: defineCommand({
        meta: {
          name: 'codegen',
          description: 'Generate the panda system',
        },
        args: {
          cwd: { type: 'string', description: 'Current working directory', default: cwd },
          config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
          watch: { type: 'boolean', description: 'Watch files and rebuild', alias: 'w' },
          outdir: { type: 'string', description: 'Output directory for generated files' },
          silent: { type: 'boolean', description: 'Suppress all messages except errors' },
        },
        run: ({ args }) => runCodegen(args as CodegenFlags),
      }),
      cssgen: defineCommand({
        meta: {
          name: 'cssgen',
          description: 'Generate CSS from project files',
        },
        args: {
          cwd: { type: 'string', description: 'Current working directory', default: cwd },
          config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
          watch: { type: 'boolean', description: 'Watch files and rebuild', alias: 'w' },
          outfile: { type: 'string', description: 'Output file for extracted CSS', alias: 'o' },
          splitting: { type: 'boolean', description: 'Emit split CSS files' },
          silent: { type: 'boolean', description: 'Suppress all messages except errors' },
        },
        run: ({ args }) => runCssgen(args as CssgenFlags),
      }),
      inspect: defineCommand({
        meta: {
          name: 'inspect',
          description: 'Inspect v2 compiler state',
        },
        args: {
          cwd: { type: 'string', description: 'Current working directory', default: cwd },
          config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
          json: { type: 'boolean', description: 'Print JSON' },
        },
        run: ({ args }) => runInspect(args as InspectFlags),
      }),
    },
  })

  await runMain(mainCommand, { rawArgs: argv.slice(2) })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
