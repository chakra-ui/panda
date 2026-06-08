import type { ImportMapInput, ImportMapOption, ImportMapOutput, SerializedConfig } from './types'
import { defaultConfig } from './defaults'

export type { ImportMapInput, ImportMapOption, ImportMapOutput }

/** Config slice accepted by {@link normalizeImportMap}. */
export interface ImportMapConfig {
  importMap?: ImportMapOption | ImportMapOption[]
  outdir?: string
  cwd?: string
}

/**
 * Normalize author `importMap` (string | object | array) to the wire shape the
 * Rust extractor consumes — category keys with `string[]` values (`recipe`, not
 * `recipes`). Ports v1 `packages/core/src/import-map.ts`.
 *
 * @example
 * ```ts
 * normalizeImportMap({ outdir: 'styled-system', importMap: '@acme/ui' })
 * // → { css: ['@acme/ui/css'], recipe: ['@acme/ui/recipes'], … }
 *
 * normalizeImportMap({ outdir: 'styled-system', importMap: ['@acme/ui', 'styled-system'] })
 * // → { css: ['@acme/ui/css', 'styled-system/css'], … }
 * ```
 */
export function normalizeImportMap(config: ImportMapConfig): ImportMapOutput {
  const outdir = outdirBasename(config.outdir ?? defaultConfig.outdir)
  const inputs = config.importMap === undefined ? [undefined] : asArray(config.importMap)
  const output = emptyImportMapOutput()

  for (const input of inputs) {
    const normalized = normalizeImportMapInput(input, outdir)
    output.css.push(...normalized.css)
    output.recipe.push(...normalized.recipe)
    output.pattern.push(...normalized.pattern)
    output.jsx.push(...normalized.jsx)
    output.tokens.push(...normalized.tokens)
  }

  return output
}

/** Ensure `SerializedConfig.importMap` is normalized before crossing the binding. */
export function prepareCompilerConfig(config: SerializedConfig): SerializedConfig {
  const importMap = normalizeImportMap(config)
  return { ...config, importMap }
}

function emptyImportMapOutput(): ImportMapOutput {
  return { css: [], recipe: [], pattern: [], jsx: [], tokens: [] }
}

function normalizeImportMapInput(input: ImportMapOption | undefined, outdir: string): ImportMapOutput {
  if (typeof input === 'string') return importMapFromRoot(input)

  const map = input ?? {}
  return {
    css: asArray(map.css ?? `${outdir}/css`),
    recipe: asArray(map.recipes ?? map.recipe ?? `${outdir}/recipes`),
    pattern: asArray(map.patterns ?? map.pattern ?? `${outdir}/patterns`),
    jsx: asArray(map.jsx ?? `${outdir}/jsx`),
    tokens: asArray(map.tokens ?? `${outdir}/tokens`),
  }
}

function importMapFromRoot(root: string): ImportMapOutput {
  return {
    css: [`${root}/css`],
    recipe: [`${root}/recipes`],
    pattern: [`${root}/patterns`],
    jsx: [`${root}/jsx`],
    tokens: [`${root}/tokens`],
  }
}

function outdirBasename(outdir: string): string {
  const parts = outdir.split('/').filter(Boolean)
  return parts.at(-1) ?? outdir
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
