import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runCli } from './cli-runner'
import { cleanupFixture, createFixture } from './helpers'

function normalizeCliOutput(output: string) {
  return output
    .replaceAll(process.cwd(), '<cwd>')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

describe('cli smoke', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('prints the CLI version', () => {
    expect(runCli(['--version'])).toMatchObject({ exitCode: 0, stdout: '2.0.0-beta.0\n', stderr: '' })
    expect(runCli(['-v'])).toMatchObject({ exitCode: 0, stdout: '2.0.0-beta.0\n', stderr: '' })
  })

  it('prints root help with the public command surface', () => {
    const result = runCli(['--help'])

    expect(result.exitCode).toBe(0)
    expect(normalizeCliOutput(result.stdout)).toMatchInlineSnapshot(`
      "Generate the panda system and CSS. Run with no subcommand for the full build. (panda v2.0.0-beta.0)

      USAGE \`panda [OPTIONS] init|dev|build|check|info|doctor|debug|buildinfo|codegen|cssgen\`

      OPTIONS

        \`--cwd="<cwd>"\`    Current working directory
                                               \`-c, --config\`    Path to panda config file
                                                \`-w, --watch\`    Watch files and rebuild
                                                   \`--outdir\`    Output directory for generated files
                                              \`-o, --outfile\`    Output file for extracted CSS
                                                \`--splitting\`    Emit split CSS files
                                                    \`--clean\`    Clean the output directory before generating
                                                     \`--json\`    Print JSON
                                                   \`--format\`    Diagnostic output format: human, pretty, json, or github
                                        \`--log-level=<level>\`    Set output level: silent, error, warn, info, or debug
                                             \`--max-warnings\`    Fail when warning diagnostics exceed this count
                                                  \`--logfile\`    Write human output to a log file
                                                    \`--trace\`    Enable compiler tracing
                                             \`--trace-output\`    Trace output: fmt or chrome-json
                                               \`--trace-file\`    Trace output file for chrome-json tracing
                                           \`--watch-debounce\`    Watch rebuild debounce in milliseconds
                                                    \`--check\`    Check generated files without writing

      COMMANDS

             \`init\`    Initialize Panda's config file
              \`dev\`    Start Panda in watch mode
            \`build\`    Generate the panda system and CSS
            \`check\`    Check generated files without writing
             \`info\`    Show project and compiler info
           \`doctor\`    Validate Panda setup and diagnostics
            \`debug\`    Dump resolved config and per-file extraction for bug reports
        \`buildinfo\`    Build a portable panda.buildinfo.json for a design-system library
          \`codegen\`    Generate the panda system
           \`cssgen\`    Generate CSS from project files

      Use \`panda <command> --help\` for more information about a command.

      "
    `)
    expect(result.stdout).toContain('init|dev|build|check|info|doctor|debug|buildinfo|codegen|cssgen')
    expect(result.stdout).toContain('panda v2.0.0-beta.0')
    expect(result.stdout).not.toContain('inspect')
    expect(result.stdout).not.toContain('validate')
  })

  it.each(['build', 'dev', 'check', 'info', 'doctor'])('prints help for panda %s', (command) => {
    const result = runCli([command, '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain(`panda ${command} v2.0.0-beta.0`)
  })

  it.each(['inspect', 'validate', 'frobnicate'])('rejects unknown command %s', (command) => {
    const result = runCli([command])

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('USAGE')
    expect(result.stderr).toBe(`[error] Unknown command \`${command}\`\n`)
  })

  it('rejects invalid flag values', () => {
    const result = runCli(['doctor', '--log-level', 'banana'])

    expect(result).toMatchObject({ exitCode: 1, stdout: '' })
    expect(result.stderr).toMatchInlineSnapshot(`
      "[error] Invalid command options
      - --log-level: expected silent, error, warn, info, or debug (received "banana")
      "
    `)
  })

  it('runs build and check against a fixture project', async () => {
    dir = createFixture()

    const build = runCli(['build', '--cwd', dir, '--log-level', 'silent'])
    expect(build).toMatchObject({ exitCode: 0, stdout: '', stderr: '' })
    expect(existsSync(join(dir, 'styled-system', 'css', 'css.js'))).toBe(true)
    expect(await readFile(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain('red')

    const check = runCli(['check', '--cwd', dir, '--log-level', 'silent'])
    expect(check).toMatchObject({ exitCode: 0, stdout: '', stderr: '' })
  })

  it('emits info and doctor JSON against a fixture project', () => {
    dir = createFixture()

    const info = runCli(['info', '--cwd', dir, '--json'])
    expect(info.exitCode).toBe(0)
    expect(JSON.parse(info.stdout)).toMatchObject({ ok: true, command: 'info', sourceCount: 1 })

    const doctor = runCli(['doctor', '--cwd', dir, '--json'])
    expect(doctor.exitCode).toBe(0)
    expect(JSON.parse(doctor.stdout)).toMatchObject({ ok: true, command: 'doctor', diagnosticCount: 0 })
  })
})
