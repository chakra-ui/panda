import { spawn } from 'node:child_process'

export function openUrl(url: string): void {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', url]]
        : ['xdg-open', [url]]

  spawn(command, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: true })
    .on('error', () => undefined)
    .unref()
}
