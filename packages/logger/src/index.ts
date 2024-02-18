import colors from 'kleur'
import { createLogger } from './create-logger'

export const quote = (...str: string[]) => colors.cyan(`\`${str.join('')}\``)

const debug = typeof process !== 'undefined' ? process.env.PANDA_DEBUG : undefined

export const logger = createLogger({
  filter: typeof process !== 'undefined' ? debug : undefined,
  isDebug: Boolean(debug),
})

export { colors }

export type { LoggerConfig } from './create-logger'
