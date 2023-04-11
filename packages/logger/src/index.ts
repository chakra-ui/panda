import colors from 'kleur'
import { createLogger } from './create-logger'

export const quote = (...str: string[]) => colors.cyan(`\`${str.join('')}\``)

export const logger = createLogger({
  filter: typeof process !== 'undefined' ? process.env.PANDA_DEBUG : undefined,
})

export { createLogScope } from './scope'
export { colors }
