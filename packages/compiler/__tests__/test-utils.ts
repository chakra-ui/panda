import type { CompilerOptions, SerializedConfig } from '../src'
import { createCompiler } from '../src'

export const importMap = {
  css: ['@panda/css'],
  recipe: ['@panda/recipes'],
  pattern: ['@panda/patterns'],
  jsx: ['@panda/jsx'],
  tokens: ['@panda/tokens'],
}

export function createUserConfig(overrides: SerializedConfig = {}): SerializedConfig {
  return {
    cwd: '/virtual',
    outdir: 'styled-system',
    importMap,
    jsxFactory: 'styled',
    ...overrides,
  }
}

/** Build a compiler from the shared virtual config. Returns a {@link Compiler}
 *  (named `createProject` historically — it's the project/compiler test handle). */
export function createProject(userConfig: SerializedConfig = {}, options: CompilerOptions = { crossFile: false }) {
  return createCompiler(createUserConfig(userConfig), options)
}
