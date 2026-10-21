import { spawn } from 'node:child_process'

export interface BrowserOpener {
  command: string
  args: string[]
  /** Windows `cmd` needs its own quoting, so Node must pass the arguments as written. */
  verbatim?: boolean
}

const OPEN_TIMEOUT_MS = 3000

/** The command that opens `url` here, or `undefined` when there's no browser to open (`BROWSER=none`, no display). */
export function browserOpener(
  url: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): BrowserOpener | undefined {
  const browser = env.BROWSER
  if (browser === 'none') return undefined
  if (platform === 'darwin') return { command: 'open', args: browser ? ['-a', browser, url] : [url] }
  if (browser) return { command: browser, args: [url] }
  if (platform === 'win32') return { command: 'cmd', args: ['/c', 'start', '""', `"${url}"`], verbatim: true }
  if (env.WSL_DISTRO_NAME) return { command: 'wslview', args: [url] }
  if (!env.DISPLAY && !env.WAYLAND_DISPLAY) return undefined
  return { command: 'xdg-open', args: [url] }
}

/** Resolves `false` when nothing could open the page, so the caller can print the link instead. */
export function openBrowser(url: string, run: typeof spawn = spawn): Promise<boolean> {
  const opener = browserOpener(url)
  if (!opener) return Promise.resolve(false)

  return new Promise((resolve) => {
    const child = run(opener.command, opener.args, {
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
      windowsVerbatimArguments: opener.verbatim,
    })
    // Openers exit once they hand off; one still running (a browser started directly) has opened the page.
    const timer = setTimeout(() => {
      child.unref()
      resolve(true)
    }, OPEN_TIMEOUT_MS)
    const settle = (opened: boolean) => {
      clearTimeout(timer)
      resolve(opened)
    }
    child.once('error', () => settle(false))
    child.once('exit', (code) => settle(code === 0))
  })
}
