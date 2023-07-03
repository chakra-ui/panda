import colors from 'kleur'
import { createLogger } from './create-logger'

export const quote = (...str: string[]) => colors.cyan(`\`${str.join('')}\``)

const debug = process.env.PANDA_DEBUG
export const logger = createLogger({
  filter: typeof process !== 'undefined' ? debug : undefined,
  isDebug: Boolean(debug),
})

export { createLogScope } from './scope'
export { colors }
