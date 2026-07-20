import pc from 'picocolors'

export interface ColorOptions {
  /** Force colors off (CLI `--no-color`). */
  noColor?: boolean
  /** Stream used for TTY detection (defaults to stdout). */
  stream?: NodeJS.WriteStream
}

/** Whether ANSI colors should be applied for human CLI output. */
export function shouldUseColor(options: ColorOptions = {}): boolean {
  if (options.noColor) return false
  if (process.env.NO_COLOR) return false
  if (process.env.FORCE_COLOR === '0') return false
  if (process.env.FORCE_COLOR) return true

  const stream = options.stream ?? process.stdout
  return Boolean(stream.isTTY)
}

export interface CliColors {
  enabled: boolean
  bold: (text: string) => string
  dim: (text: string) => string
  cyan: (text: string) => string
  blue: (text: string) => string
  yellow: (text: string) => string
  red: (text: string) => string
  green: (text: string) => string
  magenta: (text: string) => string
}

const identity = (text: string) => text

/** Picocolors helpers, or no-ops when color is disabled. */
export function createColors(options: ColorOptions = {}): CliColors {
  if (!shouldUseColor(options)) {
    return {
      enabled: false,
      bold: identity,
      dim: identity,
      cyan: identity,
      blue: identity,
      yellow: identity,
      red: identity,
      green: identity,
      magenta: identity,
    }
  }

  return {
    enabled: true,
    bold: pc.bold,
    dim: pc.dim,
    cyan: pc.cyan,
    blue: pc.blue,
    yellow: pc.yellow,
    red: pc.red,
    green: pc.green,
    magenta: pc.magenta,
  }
}

export function colorSeverity(severity: string, colors: CliColors): string {
  switch (severity) {
    case 'error':
      return colors.red(severity)
    case 'warning':
      return colors.yellow(severity)
    default:
      return colors.blue(severity)
  }
}
