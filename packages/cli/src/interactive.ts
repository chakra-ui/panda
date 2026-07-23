import { createRequire } from 'node:module'
import { shouldPrintJson } from './output'
import type { InitFlags } from './schema'

const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

export class InteractiveCancelled extends Error {
  constructor() {
    super('Operation cancelled.')
    this.name = 'InteractiveCancelled'
  }
}

export type JsxStylePropsChoice = 'all' | 'minimal' | 'none'
export type OutExtensionChoice = 'js' | 'mjs' | 'ts'

export interface InteractiveAnswers {
  postcss: boolean
  outExtension: OutExtensionChoice
  /** Omitted when the user picks “None”. */
  jsxFramework?: string
  /** Only set when a JSX framework is chosen. */
  jsxStyleProps?: JsxStylePropsChoice
  strictTokens: boolean
  gitignore: boolean
}

/** Answers from the init wizard — fills only unset CLI flags. */
export function mergeInteractiveFlags(flags: InitFlags, answers: InteractiveAnswers): InitFlags {
  return {
    ...flags,
    postcss: flags.postcss ?? answers.postcss,
    outExtension: flags.outExtension ?? answers.outExtension,
    jsxFramework: flags.jsxFramework ?? answers.jsxFramework,
    jsxStyleProps: flags.jsxStyleProps ?? answers.jsxStyleProps,
    strictTokens: flags.strictTokens ?? answers.strictTokens,
    gitignore: flags.gitignore ?? answers.gitignore,
  }
}

export type InteractiveGuardFailure = { kind: 'json' } | { kind: 'non-tty' }

/** Why interactive init cannot run, or `undefined` when it can. */
export function interactiveGuardFailure(flags: InitFlags): InteractiveGuardFailure | undefined {
  if (shouldPrintJson(flags)) return { kind: 'json' }
  if (!process.stdin.isTTY || !process.stdout.isTTY) return { kind: 'non-tty' }
  return undefined
}

export function formatInteractiveGuardFailure(failure: InteractiveGuardFailure): string {
  switch (failure.kind) {
    case 'json':
      return "--interactive can't be used with JSON output. Pass the init options as flags instead."
    case 'non-tty':
      return '--interactive needs an interactive terminal. Pass the init options as flags instead.'
  }
}

/** Clack wizard for `panda init -i`. Cancel throws {@link InteractiveCancelled}. */
export async function promptInitFlags(): Promise<InteractiveAnswers> {
  const p = await import('@clack/prompts')

  function cancelIfNeeded<T>(value: T | symbol): T {
    if (p.isCancel(value)) {
      p.cancel('Operation cancelled.')
      throw new InteractiveCancelled()
    }
    return value
  }

  p.intro(`panda v${version}`)

  const usePostcss = cancelIfNeeded(
    await p.select({
      message: 'Add a PostCSS config?',
      initialValue: 'yes',
      options: [
        { value: 'yes', label: 'Yes', hint: 'writes postcss.config.cjs' },
        { value: 'no', label: 'No', hint: 'use @pandacss/vite or another bundler plugin' },
      ],
    }),
  )

  const outExtension = cancelIfNeeded(
    await p.select({
      message: 'Generated runtime extension?',
      initialValue: 'js' as OutExtensionChoice,
      options: [
        { value: 'js', label: 'js', hint: 'default — works in most projects' },
        { value: 'mjs', label: 'mjs', hint: 'explicit ESM extension' },
        { value: 'ts', label: 'ts', hint: 'emit TypeScript sources in outdir' },
      ],
    }),
  )

  const jsxFrameworkChoice = cancelIfNeeded(
    await p.select({
      message: 'JSX framework?',
      initialValue: 'none',
      options: [
        { value: 'none', label: 'None', hint: 'css() + className only' },
        { value: 'react', label: 'React' },
        { value: 'preact', label: 'Preact' },
        { value: 'vue', label: 'Vue' },
        { value: 'solid', label: 'Solid' },
        { value: 'qwik', label: 'Qwik' },
      ],
    }),
  )

  let jsxStyleProps: JsxStylePropsChoice | undefined
  if (jsxFrameworkChoice !== 'none') {
    jsxStyleProps = cancelIfNeeded(
      await p.select({
        message: 'JSX style props?',
        initialValue: 'all' as JsxStylePropsChoice,
        options: [
          { value: 'all', label: 'all', hint: '<styled.button mt="4" />' },
          { value: 'minimal', label: 'minimal', hint: 'only the css prop on styled components' },
          { value: 'none', label: 'none', hint: 'no style props; use css() + className' },
        ],
      }),
    )
  }

  const withStrictTokens = cancelIfNeeded(
    await p.select({
      message: 'Strict tokens?',
      initialValue: 'no',
      options: [
        { value: 'no', label: 'No', hint: 'allow raw CSS values (default)' },
        { value: 'yes', label: 'Yes', hint: 'token values only on token-backed props' },
      ],
    }),
  )

  const shouldUpdateGitignore = cancelIfNeeded(
    await p.select({
      message: 'Update .gitignore?',
      initialValue: 'yes',
      options: [
        { value: 'yes', label: 'Yes', hint: 'ignore the generated outdir' },
        { value: 'no', label: 'No' },
      ],
    }),
  )

  p.outro("Let's get started! 🐼")

  return {
    postcss: usePostcss === 'yes',
    outExtension,
    jsxFramework: jsxFrameworkChoice === 'none' ? undefined : jsxFrameworkChoice,
    jsxStyleProps,
    strictTokens: withStrictTokens === 'yes',
    gitignore: shouldUpdateGitignore === 'yes',
  }
}
