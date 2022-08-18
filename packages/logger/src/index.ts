import colors from 'picocolors'
import __debug from 'debug'
import util from 'util'

export let prefix = '🐼 '

function format(args: Array<any>, customPrefix?: string) {
  let fullPrefix = [prefix, customPrefix].filter(Boolean).join(' ')
  return (
    fullPrefix +
    util
      .format('', ...args)
      .split('\n')
      .join('\n' + fullPrefix + ' ')
  )
}

export function createDebugger(namespace: string) {
  return __debug(prefix + namespace)
}

export function error(...args: Array<any>) {
  console.error(format(args, colors.red('error')))
}

export function info(...args: Array<any>) {
  console.info(format(args, colors.cyan('info')))
}

export function log(...args: Array<any>) {
  console.log(format(args))
}

export function success(...args: Array<any>) {
  console.log(format(args, colors.green('success')))
}

export function warn(...args: Array<any>) {
  console.warn(format(args, colors.yellow('warn')))
}

export function debug(...args: Array<any>) {
  createDebugger('panda')(args)
}
