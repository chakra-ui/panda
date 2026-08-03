import { describe, expect, it } from 'vitest'
import { buildCommand, buildSubcommand, checkCommand, devCommand } from '../src/commands/build'
import { doctorCommand } from '../src/commands/doctor'
import { analyzeCommand } from '../src/commands/analyze'
import { studioCommand, studioGenerateCommand } from '../src/commands/studio'
import { normalizeCliFlags } from '../src/args'

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

  it('defines studio as leaf commands so space-separated flags parse', () => {
    expect(studioCommand.meta).toMatchObject({ name: 'studio' })
    expect(studioGenerateCommand.meta).toMatchObject({ name: 'studio generate' })
    expect(studioCommand.subCommands).toBeUndefined()
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
