import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { watch, type RollupWatcher, type RollupWatcherEvent } from 'rollup'
import { afterEach, describe, expect, it } from 'vitest'
import { pandacss } from '../src'

const CONFIG = `export default {
  outdir: 'styled-system',
  include: ['./src/**/*.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
}
`

const APP = (color: string) => `import { css } from '@panda/css'
export const className = css({ color: '${color}' })
`

function createFixture(color: string) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-rollup-')))
  mkdirSync(join(dir, 'src'))
  writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
  writeFileSync(join(dir, 'index.js'), 'export const value = 1\n')
  writeFileSync(join(dir, 'src', 'App.tsx'), APP(color))
  return dir
}

function startWatcher(dir: string, watchedFiles: string[]): { watcher: RollupWatcher; ready: Promise<void> } {
  const watcher = watch({
    input: join(dir, 'index.js'),
    output: { dir: join(dir, 'dist'), format: 'es' },
    plugins: [
      pandacss({ cwd: dir }),
      {
        name: 'capture-watch-files',
        buildEnd() {
          watchedFiles.splice(0, watchedFiles.length, ...this.getWatchFiles())
        },
      },
    ],
  })
  return { watcher, ready: waitForBuild(watcher) }
}

function waitForBuild(watcher: RollupWatcher): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    watcher.on('event', (event) => {
      if (settled) return
      if (event.code === 'ERROR') {
        settled = true
        reject(event.error)
      } else if (event.code === 'END') {
        settled = true
        resolve()
      }
    })
  })
}

function waitForWatchRegistration(watcher: RollupWatcher, file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let rebuilding = false
    const interval = setInterval(() => appendFileSync(file, '\n'), 100)
    const timeout = setTimeout(() => finish(new Error('timed out waiting for Rollup to register watch files')), 5_000)

    const finish = (error?: Error) => {
      clearInterval(interval)
      clearTimeout(timeout)
      watcher.off('event', onEvent)
      if (error) reject(error)
      else resolve()
    }
    const onEvent = (event: RollupWatcherEvent) => {
      if (event.code === 'ERROR') finish(event.error)
      if (event.code === 'BUNDLE_START') {
        rebuilding = true
        clearInterval(interval)
      } else if (event.code === 'END' && rebuilding) {
        finish()
      }
    }

    watcher.on('event', onEvent)
    appendFileSync(file, '\n')
  })
}

async function waitForCss(dir: string, predicate: (css: string) => boolean): Promise<string> {
  const file = join(dir, 'dist', 'panda.css')
  for (let attempt = 0; attempt < 50; attempt++) {
    if (existsSync(file)) {
      const css = readFileSync(file, 'utf8')
      if (predicate(css)) return css
    }
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error('timed out waiting for the generated CSS')
}

describe('@pandacss/rollup watch mode', () => {
  let dir: string | undefined
  let watcher: RollupWatcher | undefined

  afterEach(async () => {
    await watcher?.close()
    watcher = undefined
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('adds CSS when a matching source file is created', async () => {
    dir = createFixture('red')
    const watchedFiles: string[] = []
    const started = startWatcher(dir, watchedFiles)
    watcher = started.watcher
    await started.ready
    await waitForWatchRegistration(watcher, join(dir, 'src', 'App.tsx'))
    expect(await waitForCss(dir, (css) => css.includes('red'))).not.toContain('rebeccapurple')
    expect(watchedFiles).toContain(join(dir, 'src', 'App.tsx'))
    expect(watchedFiles).toContain(join(dir, 'src'))

    const rebuild = waitForBuild(watcher)
    writeFileSync(join(dir, 'src', 'New.tsx'), APP('rebeccapurple'))
    await rebuild

    expect(await waitForCss(dir, (css) => css.includes('rebeccapurple'))).toContain('rebeccapurple')
  })

  it('removes CSS when a source file is deleted', async () => {
    dir = createFixture('rebeccapurple')
    const watchedFiles: string[] = []
    const started = startWatcher(dir, watchedFiles)
    watcher = started.watcher
    await started.ready
    await waitForWatchRegistration(watcher, join(dir, 'src', 'App.tsx'))
    expect(await waitForCss(dir, (css) => css.includes('rebeccapurple'))).toContain('rebeccapurple')
    expect(watchedFiles).toContain(join(dir, 'src', 'App.tsx'))

    const rebuild = waitForBuild(watcher)
    rmSync(join(dir, 'src', 'App.tsx'))
    await rebuild

    expect(await waitForCss(dir, (css) => !css.includes('rebeccapurple'))).not.toContain('rebeccapurple')
  })
})
