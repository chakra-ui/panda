import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { buildMcpArgs, getMcpRunner, runMcpViaNpx } from '../src/mcp-shim'

describe('mcp-shim', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('buildMcpArgs forwards start flags', () => {
    expect(
      buildMcpArgs('start', {
        cwd: '/tmp/app',
        config: './panda.config.ts',
        silent: true,
      }),
    ).toEqual(['--cwd', '/tmp/app', '--config', './panda.config.ts', '--silent'])
  })

  test('buildMcpArgs builds init args with clients', () => {
    expect(
      buildMcpArgs('init', {
        cwd: '/tmp/app',
        client: ['claude', 'cursor,vscode'],
      }),
    ).toEqual(['init', '--cwd', '/tmp/app', '--client', 'claude,cursor,vscode'])
  })

  test('getMcpRunner defaults to npx -y @pandacss/mcp', () => {
    expect(getMcpRunner({})).toEqual({
      command: 'npx',
      prefixArgs: ['-y', '@pandacss/mcp'],
    })
  })

  test('getMcpRunner prefers PANDACSS_MCP_BIN for local binaries', () => {
    expect(getMcpRunner({ PANDACSS_MCP_BIN: '/repo/packages/mcp/bin.js' })).toEqual({
      command: '/repo/packages/mcp/bin.js',
      prefixArgs: [],
    })
  })

  test('runMcpViaNpx spawns npx with inherited stdio', async () => {
    const child = new EventEmitter() as EventEmitter & { on: typeof EventEmitter.prototype.on }
    const spawnImpl = vi.fn().mockReturnValue(child)

    const done = runMcpViaNpx(
      'start',
      { cwd: '/tmp/app', config: './panda.config.ts' },
      { spawnImpl: spawnImpl as any, env: {} },
    )

    expect(spawnImpl).toHaveBeenCalledWith(
      'npx',
      ['-y', '@pandacss/mcp', '--cwd', '/tmp/app', '--config', './panda.config.ts'],
      expect.objectContaining({
        stdio: 'inherit',
        shell: true,
      }),
    )

    child.emit('exit', 0, null)
    await expect(done).resolves.toBe(0)
  })

  test('runMcpViaNpx uses PANDACSS_MCP_BIN when set', async () => {
    const child = new EventEmitter()
    const spawnImpl = vi.fn().mockReturnValue(child)

    const done = runMcpViaNpx(
      'init',
      { client: 'cursor' },
      {
        spawnImpl: spawnImpl as any,
        env: { PANDACSS_MCP_BIN: '/repo/packages/mcp/bin.js' },
      },
    )

    expect(spawnImpl).toHaveBeenCalledWith(
      '/repo/packages/mcp/bin.js',
      ['init', '--client', 'cursor'],
      expect.objectContaining({ stdio: 'inherit', shell: true }),
    )

    child.emit('exit', 0, null)
    await expect(done).resolves.toBe(0)
  })

  test('runMcpViaNpx propagates non-zero exit codes', async () => {
    const child = new EventEmitter()
    const spawnImpl = vi.fn().mockReturnValue(child)

    const done = runMcpViaNpx('start', {}, { spawnImpl: spawnImpl as any, env: {} })
    child.emit('exit', 2, null)
    await expect(done).resolves.toBe(2)
  })
})
