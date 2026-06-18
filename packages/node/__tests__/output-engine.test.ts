import { describe, expect, test, vi } from 'vitest'
import { OutputEngine } from '../src/output-engine'

function createEngine(fs: {
  existsSync: ReturnType<typeof vi.fn>
  readFileSync: ReturnType<typeof vi.fn>
  writeFile: ReturnType<typeof vi.fn>
  ensureDirSync: ReturnType<typeof vi.fn>
}) {
  return new OutputEngine({
    paths: { root: ['styled-system'] },
    runtime: {
      fs: {
        existsSync: fs.existsSync,
        readFileSync: fs.readFileSync,
        writeFile: fs.writeFile,
        ensureDirSync: fs.ensureDirSync,
      },
      path: {
        join: (...parts: string[]) => parts.join('/'),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
        resolve: (...parts: string[]) => parts.join('/'),
        extname: (p: string) => p.slice(p.lastIndexOf('.')),
        relative: (from: string, to: string) => to.replace(`${from}/`, ''),
        isAbsolute: (p: string) => p.startsWith('/'),
        sep: '/',
        abs: (_cwd: string, p: string) => p,
      },
      cwd: () => '/project',
      env: () => undefined,
    },
    hooks: {},
  } as any)
}

describe('OutputEngine.write', () => {
  test('writes when the file does not exist', async () => {
    const existsSync = vi.fn().mockReturnValue(false)
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const readFileSync = vi.fn()
    const ensureDirSync = vi.fn()

    const engine = createEngine({ existsSync, readFileSync, writeFile, ensureDirSync })

    await engine.write({
      id: 'styles.css',
      files: [{ file: 'styles.css', code: '.foo { color: red; }' }],
    })

    expect(readFileSync).not.toHaveBeenCalled()
    expect(writeFile).toHaveBeenCalledWith('styled-system/styles.css', '.foo { color: red; }')
  })

  test('skips the write when content is unchanged', async () => {
    const existsSync = vi.fn().mockReturnValue(true)
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const readFileSync = vi.fn().mockReturnValue('.foo { color: red; }')
    const ensureDirSync = vi.fn()

    const engine = createEngine({ existsSync, readFileSync, writeFile, ensureDirSync })

    await engine.write({
      id: 'styles.css',
      files: [{ file: 'styles.css', code: '.foo { color: red; }' }],
    })

    expect(readFileSync).toHaveBeenCalledWith('styled-system/styles.css')
    expect(writeFile).not.toHaveBeenCalled()
  })

  test('writes when content changed', async () => {
    const existsSync = vi.fn().mockReturnValue(true)
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const readFileSync = vi.fn().mockReturnValue('.foo { color: red; }')
    const ensureDirSync = vi.fn()

    const engine = createEngine({ existsSync, readFileSync, writeFile, ensureDirSync })

    await engine.write({
      id: 'styles.css',
      files: [{ file: 'styles.css', code: '.foo { color: blue; }' }],
    })

    expect(writeFile).toHaveBeenCalledWith('styled-system/styles.css', '.foo { color: blue; }')
  })

  test('skips direct writes when content is unchanged', async () => {
    const existsSync = vi.fn().mockReturnValue(true)
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const readFileSync = vi.fn().mockReturnValue('.foo { color: red; }')
    const ensureDirSync = vi.fn()

    const engine = createEngine({ existsSync, readFileSync, writeFile, ensureDirSync })

    await engine.writeFile('/tmp/report.json', '.foo { color: red; }')

    expect(ensureDirSync).toHaveBeenCalledWith('/tmp')
    expect(readFileSync).toHaveBeenCalledWith('/tmp/report.json')
    expect(writeFile).not.toHaveBeenCalled()
  })

  test('writes direct files when content changed', async () => {
    const existsSync = vi.fn().mockReturnValue(true)
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const readFileSync = vi.fn().mockReturnValue('.foo { color: red; }')
    const ensureDirSync = vi.fn()

    const engine = createEngine({ existsSync, readFileSync, writeFile, ensureDirSync })

    await engine.writeFile('/tmp/report.json', '.foo { color: blue; }')

    expect(ensureDirSync).toHaveBeenCalledWith('/tmp')
    expect(writeFile).toHaveBeenCalledWith('/tmp/report.json', '.foo { color: blue; }')
  })
})
