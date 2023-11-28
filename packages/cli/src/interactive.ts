import * as p from '@clack/prompts'
import { version } from '../package.json'

export const interactive = async () => {
  p.intro(`panda v${version}`)

  const initFlags = await p.group(
    {
      usePostcss: () =>
        p.select({
          message: 'Would you like to use PostCSS ?',
          initialValue: 'yes',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        }),
      useMjsExtension: () =>
        p.select({
          message: 'Use the mjs extension ?',
          initialValue: 'yes',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        }),
      jsxOptions: () =>
        p.group({
          styleProps: () =>
            p.select({
              message: 'Would you like to use JSX Style Props ?',
              initialValue: 'yes',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            }),
          jsxFramework: () =>
            p.select({
              message: 'What JSX framework?',
              initialValue: 'react',
              options: [
                { value: 'react', label: 'React' },
                { value: 'vue', label: 'Vue' },
                { value: 'solid', label: 'Solid' },
                { value: 'qwik', label: 'Qwik' },
              ],
            }),
        }),
      whatSyntax: () =>
        p.select({
          message: 'What css syntax would you like to use?',
          initialValue: 'object',
          options: [
            { value: 'object-literal', label: 'Object' },
            { value: 'template-literal', label: 'Template literal' },
          ],
        }),
      withStrictTokens: () =>
        p.select({
          message: 'Use strict tokens to enforce full type-safety?',
          initialValue: 'no',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        }),
      shouldUpdateGitignore: () =>
        p.select({
          message: 'Update gitignore?',
          initialValue: 'yes',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        }),
    },
    {
      // On Cancel callback that wraps the group
      // So if the user cancels one of the prompts in the group this function will be called
      onCancel: () => {
        p.cancel('Operation cancelled.')
        process.exit(0)
      },
    },
  )

  p.outro("Let's get started! 🐼")

  return {
    postcss: initFlags.usePostcss === 'yes',
    outExtension: initFlags.useMjsExtension === 'yes' ? 'mjs' : 'js',
    jsxFramework: initFlags.jsxOptions.jsxFramework,
    syntax: initFlags.whatSyntax,
    strictTokens: initFlags.withStrictTokens === 'yes',
    gitignore: initFlags.shouldUpdateGitignore === 'yes',
  } as InitFlags
}

export interface InitFlags {
  postcss: boolean
  outExtension: string
  jsxFramework: string
  syntax: string
  gitignore: boolean
}
