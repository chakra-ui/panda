import colors from 'kleur'
import { createLogger, type LoggerConfig } from './create-logger'

export const quote = (...str: string[]) => colors.cyan(`\`${str.join('')}\``)

export { createLogger, colors, type LoggerConfig }
