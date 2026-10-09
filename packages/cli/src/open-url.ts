import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function openUrl(url: string): void {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', `"${redirectFile(url)}"`]]
        : ['xdg-open', [url]]

  spawn(command, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: true })
    .on('error', () => undefined)
    .unref()
}

function redirectFile(url: string): string {
  const file = join(tmpdir(), 'panda-studio.html')
  writeFileSync(file, `<!doctype html><script>location.replace(${JSON.stringify(url)})</script>`)
  return file
}
