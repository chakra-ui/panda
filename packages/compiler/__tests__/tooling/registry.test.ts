import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ProjectRegistry } from '../../src/tooling'

const FIXTURE_DIR = join(import.meta.dirname, '../fixtures/registry-preset-tokens')

async function pollUntil<T>(get: () => Promise<T>, done: (value: T) => boolean, timeoutMs = 5000): Promise<T> {
  const start = Date.now()
  let value = await get()
  while (!done(value) && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    value = await get()
  }
  return value
}

describe('ProjectRegistry', () => {
  const registries: ProjectRegistry[] = []

  afterEach(() => {
    for (const registry of registries) registry.invalidate()
    registries.length = 0
  })

  function createRegistry(options?: ConstructorParameters<typeof ProjectRegistry>[0]) {
    const registry = new ProjectRegistry(options)
    registries.push(registry)
    return registry
  }

  it('resolves preset tokens from a fixture config', async () => {
    const registry = createRegistry()
    const project = await registry.getProject({ cwd: FIXTURE_DIR })
    const spec = project.compiler.spec()

    expect(spec.tokens.values['colors.red.500']).toBeDefined()
  })

  it('caches by (cwd, configPath)', async () => {
    const registry = createRegistry()
    const [a, b] = await Promise.all([
      registry.getProject({ cwd: FIXTURE_DIR }),
      registry.getProject({ cwd: FIXTURE_DIR }),
    ])
    expect(a).toBe(b)
  })

  it('shares one cached project across files in different subdirectories of a split config', async () => {
    const registry = createRegistry()
    const [fromRoot, fromSubdir] = await Promise.all([
      registry.getProject({ cwd: FIXTURE_DIR }),
      registry.getProject({ cwd: join(FIXTURE_DIR, 'recipes') }),
    ])
    expect(fromSubdir).toBe(fromRoot)
  })

  it('invalidate() clears the cache so a subsequent getProject rebuilds', async () => {
    let calls = 0
    const registry = createRegistry({
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

  describe('live reload', () => {
    let dir: string | undefined

    afterEach(() => {
      if (dir) rmSync(dir, { recursive: true, force: true })
      dir = undefined
    })

    it('picks up a change to the config file itself without an explicit invalidate() call', async () => {
      const cwd = mkdtempSync(join(tmpdir(), 'panda-registry-'))
      dir = cwd
      const configPath = join(cwd, 'panda.config.ts')
      const configWithColor = (hex: string) =>
        `export default { outdir: 'styled-system', theme: { tokens: { colors: { red: { 500: { value: '${hex}' } } } } } }`
      writeFileSync(configPath, configWithColor('#f00'))

      const registry = createRegistry()
      const first = await registry.getProject({ cwd })
      expect(first.compiler.spec().tokens.values['colors.red.500']).toBe('#f00')

      writeFileSync(configPath, configWithColor('#e00'))
      const second = await pollUntil(
        () => registry.getProject({ cwd }),
        (project) => project !== first,
        10_000,
      )

      expect(second).not.toBe(first)
      expect(second.compiler.spec().tokens.values['colors.red.500']).toBe('#e00')
    }, 15_000)

    it('picks up a change to a cwd-relative imported dependency when cwd is a subdirectory', async () => {
      // Load cwd is `app/`, config + imported tokens live one level up — deps are
      // recorded as `../tokens.ts` relative to cwd (not the config directory).
      const root = mkdtempSync(join(tmpdir(), 'panda-registry-'))
      dir = root
      const app = join(root, 'app')
      mkdirSync(app)
      const tokensPath = join(root, 'tokens.ts')
      const writeTokens = (hex: string) => writeFileSync(tokensPath, `export const red = '${hex}'\n`)
      writeTokens('#f00')
      writeFileSync(
        join(root, 'panda.config.ts'),
        [
          "import { red } from './tokens'",
          'export default {',
          "  outdir: 'styled-system',",
          '  theme: { tokens: { colors: { red: { 500: { value: red } } } } },',
          '}',
        ].join('\n'),
      )

      const registry = createRegistry()
      const first = await registry.getProject({ cwd: app })
      expect(first.compiler.spec().tokens.values['colors.red.500']).toBe('#f00')
      expect(first.dependencies.some((dep) => dep.replaceAll('\\', '/').endsWith('tokens.ts'))).toBe(true)

      writeTokens('#e00')
      const second = await pollUntil(
        () => registry.getProject({ cwd: app }),
        (project) => project !== first,
        10_000,
      )

      expect(second).not.toBe(first)
      expect(second.compiler.spec().tokens.values['colors.red.500']).toBe('#e00')
    }, 15_000)

    it('retries a config that failed to load once it is fixed and saved', async () => {
      const cwd = mkdtempSync(join(tmpdir(), 'panda-registry-'))
      dir = cwd
      const configPath = join(cwd, 'panda.config.ts')
      writeFileSync(configPath, 'this is not valid javascript {{{')

      const registry = createRegistry()
      await expect(registry.getProject({ cwd })).rejects.toThrow()

      writeFileSync(configPath, "export default { outdir: 'styled-system' }")
      let succeeded = false
      await pollUntil(
        async () => {
          try {
            await registry.getProject({ cwd })
            succeeded = true
          } catch {
            succeeded = false
          }
          return succeeded
        },
        (value) => value,
        10_000,
      )

      expect(succeeded).toBe(true)
    }, 15_000)
  })
})
