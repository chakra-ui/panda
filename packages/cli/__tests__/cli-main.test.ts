import { describe, expect, it } from 'vitest'
import { buildCommand, buildSubcommand, checkCommand, devCommand } from '../src/commands/build'
import { doctorCommand } from '../src/commands/doctor'
import { analyzeCommand } from '../src/commands/analyze'
import { normalizeCliFlags } from '../src/args'
import { normalizeRawArgs } from '../src/cli-main'

describe('cli main', () => {
  it('defines the default build command route', () => {
    expect(buildCommand.meta).toMatchObject({ name: 'panda' })
  })

  it('defines standard lifecycle commands', () => {
    expect(buildSubcommand.meta).toMatchObject({ name: 'build' })
    expect(devCommand.meta).toMatchObject({ name: 'dev' })
    expect(checkCommand.meta).toMatchObject({ name: 'check' })
    expect(analyzeCommand.meta).toMatchObject({ name: 'analyze' })
    expect(doctorCommand.meta).toMatchObject({ name: 'doctor' })
  })

  it('keeps a bare --spec from swallowing the flag after it', () => {
    expect(normalizeRawArgs(['codegen', '--spec', '--log-level', 'silent'])).toMatchInlineSnapshot(`
      [
        "codegen",
        "--spec=",
        "--log-level",
        "silent",
      ]
    `)
  })

  it('leaves the path on --spec=<file> alone', () => {
    expect(normalizeRawArgs(['codegen', '--spec=meta.json'])).toMatchInlineSnapshot(`
      [
        "codegen",
        "--spec=meta.json",
      ]
    `)
  })

  it('still expands -v to --version', () => {
    expect(normalizeRawArgs(['-v'])).toMatchInlineSnapshot(`
      [
        "--version",
      ]
    `)
  })

  it('normalizes Citty flags for schema validation', () => {
    expect(normalizeCliFlags({ color: false, 'skip-presets': true })).toMatchInlineSnapshot(`
      {
        "noColor": true,
        "skipPresets": true,
      }
    `)
  })
})
