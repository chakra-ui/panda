import { logger } from '@pandacss/logger'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

export const startProfiling = async (cwd: string, prefix: string, isWatching?: boolean) => {
  const inspector = await import('node:inspector').then((r) => r.default)

  const session = new inspector.Session()
  session.connect()

  let state: ProfileState = 'idle'
  const setState = (s: ProfileState) => {
    state = s
  }

  await new Promise<void>((resolve) => {
    session.post('Profiler.enable', () => {
      session.post('Profiler.start', () => {
        setState('profiling')
        resolve()
      })
    })
  })

  const toggleProfiler = () => {
    if (state === 'idle') {
      console.log('Starting CPU profiling...')
      setState('starting')
      session.post('Profiler.start', () => {
        setState('profiling')
        console.log("Press 'p' to stop profiling...")
      })
    } else if (state === 'profiling') {
      console.log('Stopping CPU profiling...')
      stopProfiling()
    }
  }

  if (isWatching) {
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) process.stdin.setRawMode(true)
    console.log("Press 'p' to stop profiling...")

    process.stdin.on('keypress', (str, key) => {
      // Start/stop profiling on 'p'
      if (key.name === 'p') {
        toggleProfiler()
      }

      // Exit the process on Ctrl+C
      if (key.ctrl && key.name === 'c') {
        stopProfiling(() => process.exit())
      }
    })
  }

  const stopProfiling = (cb?: () => void) => {
    if (state !== 'profiling') {
      cb?.()
      return
    }

    setState('stopping')
    session.post('Profiler.stop', (err, params) => {
      setState('idle')

      if (err) {
        logger.error('cpu-prof', err)
        cb?.()
        return
      }

      if (!params?.profile) {
        cb?.()
        return
      }

      const date = new Date()
      const timestamp = date.toISOString().replace(/[-:.]/g, '')
      const title = `panda-${prefix}-${timestamp}`

      const outfile = path.join(cwd, `${title}.cpuprofile`)
      fs.writeFileSync(outfile, JSON.stringify(params.profile))
      logger.info('cpu-prof', outfile)
      cb?.()
    })
  }

  return stopProfiling
}

type ProfileState = 'idle' | 'starting' | 'profiling' | 'stopping'
