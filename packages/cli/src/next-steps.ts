import { relative } from 'node:path'
import stringWidth from 'string-width'
import { createColors, type ColorOptions } from './color'

const TITLES = ['Sweet', 'Divine', 'Pandalicious', 'Super'] as const

export interface InitSummaryOptions extends ColorOptions {
  cwd: string
  configPath: string
  outdir: string
  configWritten: boolean
  postcssWritten: boolean
  gitignoreWritten: boolean
  codegenFiles: readonly string[]
  presetsInstalled: readonly string[]
}

/** Human success summary after init (relative paths, aligned actions). */
export function formatInitSummary(options: InitSummaryOptions): string {
  const colors = createColors(options)
  const configRel = toDisplayPath(options.cwd, options.configPath)
  const lines = [colors.bold('✨ Panda initialized'), '']

  lines.push(row(options.configWritten ? 'wrote' : 'kept', colors.cyan(configRel)))
  if (options.postcssWritten) lines.push(row('wrote', colors.cyan('postcss.config.cjs')))
  if (options.presetsInstalled.length > 0) {
    lines.push(row('installed', options.presetsInstalled.join(', ')))
  }
  if (options.gitignoreWritten) lines.push(row('updated', colors.cyan('.gitignore')))
  if (options.codegenFiles.length > 0) {
    lines.push(row('generated', `${options.codegenFiles.length} files → ${colors.cyan(`${options.outdir}/`)}`))
  }

  return lines.join('\n')
}

/** Human next-steps box shown after a successful interactive/human init. */
export function formatInitNextSteps(options: ColorOptions & { outdir: string } = { outdir: 'styled-system' }): string {
  const colors = createColors(options)
  const title = `🐼 ${TITLES[Math.floor(Math.random() * TITLES.length)]}! ✨`
  const content = [
    colors.bold(colors.cyan('Next steps')),
    '',
    '1. Add cascade layers to your root CSS:',
    '',
    '   @layer reset, base, tokens, recipes, utilities;',
    '',
    '2. Import that CSS (and your generated styles) at the app root.',
    '',
    `3. Start building — styles land in ${options.outdir}/.`,
  ].join('\n')

  return createBox({ content, title, noColor: options.noColor, stream: options.stream })
}

function row(action: string, detail: string): string {
  return `  ${action.padEnd(9)} ${detail}`
}

function toDisplayPath(cwd: string, file: string): string {
  const rel = relative(cwd, file)
  return rel && !rel.startsWith('..') ? rel : file
}

function createBox(options: ColorOptions & { content: string; title?: string }): string {
  const colors = createColors(options)
  const paint = colors.enabled ? colors.magenta : (text: string) => text
  const lines = options.content.replace(/\s+$/u, '').split('\n')
  const title = options.title ? ` ${options.title} ` : undefined
  // Inner width between the side borders (includes 1-space padding each side).
  const innerWidth = Math.max(24, ...lines.map((line) => stringWidth(line) + 2), title ? stringWidth(title) : 0)
  const bar = '─'.repeat(innerWidth)

  const topMid = title ? centerTitle(title, bar) : bar
  const top = `${paint('╭')}${paintTitleBar(topMid, title, paint)}${paint('╮')}`

  const body = lines.map((line) => {
    const pad = ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(line)))
    return `${paint('│')} ${line}${pad} ${paint('│')}`
  })

  const bottom = `${paint('╰')}${paint(bar)}${paint('╯')}`
  return [top, ...body, bottom].join('\n')
}

/** Splice `title` into a horizontal bar of the same display width (boxen `makeTitle`). */
function centerTitle(title: string, horizontal: string): string {
  const textWidth = stringWidth(title)
  let rest = horizontal.slice(textWidth)
  if (rest.length % 2 === 1) {
    rest = rest.slice(Math.floor(rest.length / 2))
    return `${rest.slice(1)}${title}${rest}`
  }
  rest = rest.slice(rest.length / 2)
  return `${rest}${title}${rest}`
}

/** Color only the `─` segments so the title keeps its own styling. */
function paintTitleBar(bar: string, title: string | undefined, paint: (text: string) => string): string {
  if (!title) return paint(bar)
  const index = bar.indexOf(title)
  if (index === -1) return paint(bar)
  return `${paint(bar.slice(0, index))}${title}${paint(bar.slice(index + title.length))}`
}
