import { defineCommand } from 'citty'
import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { baseArgs } from '../args'

const defaultStudioUrl = process.env.PANDA_STUDIO_URL ?? 'http://localhost:3000'

export const specCommand = defineCommand({
  meta: {
    name: 'spec',
    description: 'Share your design system spec and open it in Spec Studio',
  },
  args: () => ({
    ...baseArgs(),
    outdir: { type: 'string', description: 'Directory holding the generated spec', default: 'styled-system' },
    'studio-url': { type: 'string', valueHint: 'url', description: 'Spec Studio base URL', default: defaultStudioUrl },
    open: { type: 'boolean', description: 'Open the shared spec in your browser', default: true },
  }),
  run: async ({ args }) => {
    const cwd = resolve(args.cwd ?? process.cwd())
    const outdir = join(cwd, args.outdir)
    const tokensPath = join(outdir, 'specs', 'tokens.json')

    if (!existsSync(tokensPath)) {
      console.error(`No spec found at ${tokensPath}. Run \`panda codegen\` first.`)
      process.exitCode = 1
      return
    }

    const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'))
    const cssPath = join(outdir, 'styles.css')
    const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : null
    const studioUrl = String(args['studio-url']).replace(/\/$/, '')

    let res: Awaited<ReturnType<typeof fetch>>
    try {
      res = await fetch(`${studioUrl}/api/specs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tokens, css, title: basename(cwd) }),
      })
    } catch {
      console.error(`Couldn't reach Spec Studio at ${studioUrl}. Is it running?`)
      process.exitCode = 1
      return
    }

    if (!res.ok) {
      console.error(`Spec Studio rejected the spec (${res.status}).`)
      process.exitCode = 1
      return
    }

    const { url } = (await res.json()) as { url: string }
    const full = `${studioUrl}${url}`
    console.log(`Shared: ${full}`)

    if (!args.open) return

    let parsed: URL
    try {
      parsed = new URL(full)
    } catch {
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return

    if (process.platform === 'darwin') execFile('open', [full])
    else if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', full])
    else execFile('xdg-open', [full])
  },
})
