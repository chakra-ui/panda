import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function openUrl(url: string): Promise<boolean> {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', `"${redirectFile(url)}"`]]
        : ['xdg-open', [url]]

  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: true })
    const done = (opened: boolean) => {
      clearTimeout(timer)
      child.unref()
      resolve(opened)
    }
    const timer = setTimeout(() => done(true), 3000)
    child.on('error', () => done(false)).on('exit', (code) => done(code === 0))
  })
}

function redirectFile(url: string): string {
  const file = join(tmpdir(), 'panda-studio.html')
  writeFileSync(file, `<!doctype html><script>location.replace(${JSON.stringify(url)})</script>`)
  return file
}
