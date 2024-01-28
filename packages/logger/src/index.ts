import colors from 'kleur'
import { createLogger } from './create-logger'

export const quote = (...str: string[]) => colors.cyan(`\`${str.join('')}\``)

export { createLogger, colors }
