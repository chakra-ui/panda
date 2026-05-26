import type { Matchers, ProjectOptions, UserConfig } from '../src'
import { Project } from '../src'

export const matchers: Matchers = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/recipes'] },
  pattern: { modules: ['@panda/patterns'] },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box'] },
  tokens: { modules: ['@panda/tokens'], names: ['token'] },
}

export const importMap = {
  css: ['@panda/css'],
  recipe: ['@panda/recipes'],
  pattern: ['@panda/patterns'],
  jsx: ['@panda/jsx'],
  tokens: ['@panda/tokens'],
}

export function createUserConfig(overrides: UserConfig = {}): UserConfig {
  return {
    cwd: '/virtual',
    outdir: 'styled-system',
    importMap,
    jsxFactory: 'styled',
    ...overrides,
  }
}

export function createProject(userConfig: UserConfig = {}, options: ProjectOptions = { crossFile: false }) {
  return Project.fromConfig(createUserConfig(userConfig), options)
}
