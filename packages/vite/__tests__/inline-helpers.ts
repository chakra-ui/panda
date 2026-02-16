import { createContext } from '@pandacss/fixture'
import type { Config } from '@pandacss/types'
import { format } from 'prettier'
import { inlineFile } from '../src/inline'

export const filePath = 'app/src/test.tsx'

export function inlineTransform(code: string, userConfig?: Config) {
  const ctx = createContext(userConfig)
  ctx.project.addSourceFile(filePath, code)

  const encoder = ctx.encoder
  const result = ctx.project.parseSourceFile(filePath, encoder)
  if (!result || result.isEmpty()) return undefined

  return inlineFile(code, filePath, result, ctx)
}

/** Strip import statements so result can be evaluated with new Function() */
export function stripImports(code: string): string {
  return code.replace(/^\s*import\s+.*$/gm, '')
}

/** Extract the transformed user code (strip helpers + imports), then format with prettier */
export async function getTransformedCode(code: string): Promise<string> {
  const raw = code
    .replace(/^var __cva[\s\S]*?^};\n/m, '')
    .replace(/^var __sva[\s\S]*?^};\n/m, '')
    .replace(/^\s*import\s+.*$/gm, '')
    .trim()

  return format(raw, { parser: 'babel', printWidth: 100, semi: false, singleQuote: true })
}

/** Like getTransformedCode but preserves import lines (strips only runtime helpers) */
export async function getFullTransformedCode(code: string): Promise<string> {
  const raw = code
    .replace(/^var __cva[\s\S]*?^};\n/m, '')
    .replace(/^var __sva[\s\S]*?^};\n/m, '')
    .trim()

  return format(raw, { parser: 'typescript', printWidth: 100, semi: false, singleQuote: true })
}
