import { logger } from '@pandacss/logger'
import fs from 'node:fs'
import path from 'node:path'

interface LogstreamOptions {
  cwd?: string
  logfile?: string
}

export const setLogStream = (options: LogstreamOptions) => {
  const { cwd = process.cwd() } = options

  let stream: fs.WriteStream | undefined

  if (options.logfile) {
    const outPath = path.resolve(cwd, options.logfile)

    ensure(outPath)
    logger.info('Logfile', outPath)

    stream = fs.createWriteStream(outPath, { flags: 'a' })

    logger.onLog = (entry) => {
      stream?.write(JSON.stringify(entry) + '\n')
    }
  }

  process.once('SIGINT', () => {
    stream?.end()
  })

  return {
    end() {
      stream?.end()
    },
    [Symbol.dispose]: () => {
      stream?.end()
    },
  }
}

const ensure = (outPath: string) => {
  const dirname = path.dirname(outPath)
  fs.mkdirSync(dirname, { recursive: true })
  return outPath
}
