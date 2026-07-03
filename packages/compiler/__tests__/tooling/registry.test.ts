import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ProjectRegistry } from '../../src/tooling'

const FIXTURE_DIR = join(import.meta.dirname, '../fixtures/registry-preset-tokens')

describe('ProjectRegistry', () => {
  it('resolves preset tokens from a fixture config', async () => {
    const registry = new ProjectRegistry()
    const project = await registry.getProject({ cwd: FIXTURE_DIR })
    const spec = project.compiler.spec()

    expect(spec.tokens.values['colors.red.500']).toBeDefined()
  })

  it('caches by (cwd, configPath)', async () => {
    const registry = new ProjectRegistry()
    const [a, b] = await Promise.all([
      registry.getProject({ cwd: FIXTURE_DIR }),
      registry.getProject({ cwd: FIXTURE_DIR }),
    ])
    expect(a).toBe(b)
  })

  it('invalidate() clears the cache so a subsequent getProject rebuilds', async () => {
    let calls = 0
    const registry = new ProjectRegistry({
      createProject: async (key) => {
        calls++
        return {
          compiler: {} as never,
          configPath: key.configPath ?? 'panda.config.ts',
          dependencies: [],
          outdir: 'styled-system',
          designSystemDiagnostics: [],
        }
      },
    })

    await registry.getProject({ cwd: FIXTURE_DIR })
    await registry.getProject({ cwd: FIXTURE_DIR })
    expect(calls).toBe(1)

    registry.invalidate()
    await registry.getProject({ cwd: FIXTURE_DIR })
    expect(calls).toBe(2)
  })
})
