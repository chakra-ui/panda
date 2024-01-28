import { type LoggerConfig } from '@pandacss/logger'
import fs from 'node:fs'
import path from 'node:path'

interface LogstreamOptions {
  cwd: string
  logfile?: string
}

export const createLogStream = (options: LogstreamOptions) => {
  const { cwd } = options

  let stream: fs.WriteStream | undefined
  let onLog: LoggerConfig['onLog']

  if (options.logfile) {
    const outPath = path.resolve(cwd, options.logfile)
    ensure(outPath)
    console.log('Logfile', outPath)
    stream = fs.createWriteStream(outPath, { flags: 'a' })
    onLog = (entry) => {
      stream!.write(JSON.stringify(entry) + '\n')
    }
  }

  return {
    onLog,
    onClean: () => {
      stream?.end()
    },
    [Symbol.dispose]: () => {
      stream?.end()
    },
  } as {
    onLog?: LoggerConfig['onLog']
    onClean: () => void
  }
}

const ensure = (outPath: string) => {
  const dirname = path.dirname(outPath)
  fs.mkdirSync(dirname, { recursive: true })
  return outPath
}
