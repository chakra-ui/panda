import { createDebugger } from '@css-panda/logger'

export const debug = createDebugger('read-config')

export const createDebug = (label: string, ...args: any) => {
  debug.extend(label, ':')(args)
}
