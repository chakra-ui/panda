import { PandaContext, loadConfigAndCreateContext } from '@pandacss/node'
import { runAsWorker } from 'synckit'
import { createContext } from '@pandacss/fixture'
import { resolveTsPathPattern } from '@pandacss/config/ts-path'
import type { ImportResult } from '@pandacss/core'
import { findConfig } from '@pandacss/config'
import path from 'path'

let promise: Promise<PandaContext> | undefined
let configPath: string | undefined

async function _getContext(configPath: string | undefined) {
  if (!configPath) throw new Error('Invalid config path')

  const cwd = path.dirname(configPath)

  const ctx = await loadConfigAndCreateContext({ configPath, cwd })
  return ctx
}

export async function getContext(opts: Opts) {
  if (process.env.NODE_ENV === 'test') {
    const ctx = createContext({ importMap: './panda' })
    ctx.getFiles = () => ['./src/valid.tsx']
    return ctx
  } else {
    configPath = configPath || findConfig({ cwd: opts.configPath ?? opts.currentFile })
    promise = promise || _getContext(configPath)
    return await promise
  }
}

async function filterInvalidTokenz(ctx: PandaContext, paths: string[]): Promise<string[]> {
  return paths.filter((path) => !ctx.utility.tokens.get(path))
}

async function isColorToken(ctx: PandaContext, value: string): Promise<boolean> {
  return !!ctx.utility.tokens.values.get('colors')?.get(value)
}

async function isColorAttribute(ctx: PandaContext, _attr: string): Promise<boolean> {
  const longhand = await resolveLongHand(ctx, _attr)
  const attr = longhand || _attr
  const attrConfig = ctx.utility.config[attr]
  return attrConfig?.values === 'colors'
}

async function isValidFile(ctx: PandaContext, fileName: string): Promise<boolean> {
  return ctx.getFiles().includes(fileName)
}

async function resolveShorthand(ctx: PandaContext, name: string): Promise<string> {
  return ctx.utility.resolveShorthand(name)
}

async function resolveLongHand(ctx: PandaContext, name: string): Promise<string> {
  const reverseShorthandsMap = new Map()

  for (const [key, values] of ctx.utility.getPropShorthandsMap()) {
    for (const value of values) {
      reverseShorthandsMap.set(value, key)
    }
  }

  return reverseShorthandsMap.get(name)
}

async function isValidProperty(ctx: PandaContext, name: string) {
  return ctx.isValidProperty(name)
}

async function matchFile(ctx: PandaContext, name: string, imports: ImportResult[]) {
  const file = ctx.imports.file(imports)

  return file.match(name)
}

type MatchImportResult = {
  name: string
  alias: string
  mod: string
}
async function matchImports(ctx: PandaContext, result: MatchImportResult) {
  return ctx.imports.match(result, (mod) => {
    const { tsOptions } = ctx.parserOptions
    if (!tsOptions?.pathMappings) return
    return resolveTsPathPattern(tsOptions.pathMappings, mod)
  })
}

type Opts = {
  currentFile: string
  configPath?: string
}

export function runAsync(action: 'filterInvalidTokenz', opts: Opts, paths: string[]): Promise<string[]>
export function runAsync(action: 'isColorToken', opts: Opts, value: string): Promise<boolean>
export function runAsync(action: 'isColorAttribute', opts: Opts, attr: string): Promise<boolean>
export function runAsync(action: 'isValidFile', opts: Opts, fileName: string): Promise<string>
export function runAsync(action: 'resolveShorthand', opts: Opts, name: string): Promise<string>
export function runAsync(action: 'resolveLongHand', opts: Opts, name: string): Promise<string>
export function runAsync(action: 'isValidProperty', opts: Opts, name: string): Promise<boolean>
export function runAsync(action: 'matchFile', opts: Opts, name: string, imports: ImportResult[]): Promise<boolean>
export function runAsync(action: 'matchImports', opts: Opts, result: MatchImportResult): Promise<boolean>
export async function runAsync(action: string, opts: Opts, ...args: any): Promise<any> {
  const ctx = await getContext(opts)

  switch (action) {
    case 'matchImports':
      // @ts-expect-error cast
      return matchImports(ctx, ...args)
    case 'matchFile':
      // @ts-expect-error cast
      return matchFile(ctx, ...args)
    case 'isValidProperty':
      // @ts-expect-error cast
      return isValidProperty(ctx, ...args)
    case 'resolveLongHand':
      // @ts-expect-error cast
      return resolveLongHand(ctx, ...args)
    case 'resolveShorthand':
      // @ts-expect-error cast
      return resolveShorthand(ctx, ...args)
    case 'isValidFile':
      return isValidFile(ctx, opts.currentFile)
    case 'isColorAttribute':
      // @ts-expect-error cast
      return isColorAttribute(ctx, ...args)
    case 'isColorToken':
      // @ts-expect-error cast
      return isColorToken(ctx, ...args)
    case 'filterInvalidTokenz':
      // @ts-expect-error cast
      return filterInvalidTokenz(ctx, ...args)
  }
}

export function run(action: 'filterInvalidTokenz', opts: Opts, paths: string[]): string[]
export function run(action: 'isColorToken', opts: Opts, value: string): boolean
export function run(action: 'isColorAttribute', opts: Opts, attr: string): boolean
export function run(action: 'isValidFile', opts: Opts): boolean
export function run(action: 'resolveShorthand', opts: Opts, name: string): string
export function run(action: 'resolveLongHand', opts: Opts, name: string): string
export function run(action: 'isValidProperty', opts: Opts, name: string): boolean
export function run(action: 'matchFile', opts: Opts, name: string, imports: ImportResult[]): boolean
export function run(action: 'matchImports', opts: Opts, result: MatchImportResult): boolean
export function run(action: string, opts: Opts, ...args: any[]): any {
  // @ts-expect-error cast
  return runAsync(action, opts, ...args)
}

runAsWorker(run as any)
