import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { bundleNRequire } from '../src/bundle-n-require'

function writeConfig(contents: string) {
  const dir = mkdtempSync(join(tmpdir(), 'panda-bnr-'))
  const file = join(dir, 'panda.config.ts')
  writeFileSync(file, contents)
  return { dir, file }
}

describe('bundleNRequire', () => {
  test('loads a config that pulls in a node builtin', async () => {
    const { dir, file } = writeConfig(
      `import { join } from 'node:path'\nexport default { outdir: join('styled-system') }\n`,
    )
    const { mod } = await bundleNRequire(file, { cwd: dir })
    expect(mod.default ?? mod).toEqual({ outdir: 'styled-system' })
  })

  test('surfaces the real error instead of masking it with the node-eval message', async () => {
    const { dir, file } = writeConfig(
      `import { join } from 'node:path'\nconst broken = (undefined as any).nope\nexport default { outdir: join(broken) }\n`,
    )

    let error: Error | undefined
    try {
      await bundleNRequire(file, { cwd: dir })
    } catch (err) {
      error = err as Error
    }

    expect(error).toBeInstanceOf(Error)
    const message = (error as Error).message
    expect(message).not.toContain('Please pass in filename to use require')
    expect(message).toMatch(/nope|undefined/)
  })
})
