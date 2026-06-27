import { describe, expect, it } from 'vitest'
import { buildCommand, buildSubcommand, checkCommand, devCommand } from '../src/commands/build'
import { doctorCommand } from '../src/commands/doctor'
import { infoCommand } from '../src/commands/info'
import { analyzeCommand } from '../src/commands/analyze'

describe('cli main', () => {
  it('defines the default build command route', () => {
    expect(buildCommand.meta).toMatchObject({ name: 'panda' })
  })

  it('defines standard lifecycle commands', () => {
    expect(buildSubcommand.meta).toMatchObject({ name: 'build' })
    expect(devCommand.meta).toMatchObject({ name: 'dev' })
    expect(checkCommand.meta).toMatchObject({ name: 'check' })
    expect(analyzeCommand.meta).toMatchObject({ name: 'analyze' })
    expect(infoCommand.meta).toMatchObject({ name: 'info' })
    expect(doctorCommand.meta).toMatchObject({ name: 'doctor' })
  })
})
