import { createDebugger } from '@css-panda/logger'

const debug = createDebugger('cli')

export const createDebug = (label: string, ...args: any) => {
  debug.extend(label, ':')(args)
}
