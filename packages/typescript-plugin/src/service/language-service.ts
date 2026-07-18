import ts from 'typescript'
import type { ImportMapOutput } from '@pandacss/types'
import {
  completeConfigStyleObject,
  completeConfigTokenPath,
  completeSemanticTokenObject,
  findConfigTokenRefAt,
  resolveModuleTarget,
} from '@pandacss/compiler/tooling'
import type { CompletionEntry, SpecIndex } from '@pandacss/compiler/tooling'
import { findEnclosingStringLiteral, getSemanticTokenCursorInfo, getStyleObjectCursorInfo } from './ast'

export interface DocumentQuery {
  fileName: string
  source: string
  position: number
  /** Reuse an already-parsed AST (e.g. tsserver's own Program) instead of re-parsing `source`. */
  sourceFile?: ts.SourceFile
}

export interface LanguageServiceContext {
  specIndex: SpecIndex
  importMap: ImportMapOutput
  outdir: string
}

export interface HoverInfo {
  text: string
  start: number
  end: number
}

function literalContentStart(literal: ts.StringLiteralLike): number {
  return literal.getStart() + 1
}

export function getCompletions(query: DocumentQuery, context: LanguageServiceContext): CompletionEntry[] {
  const sourceFile = query.sourceFile ?? ts.createSourceFile(query.fileName, query.source, ts.ScriptTarget.Latest, true)

  const literal = findEnclosingStringLiteral(sourceFile, query.position)
  if (literal) {
    const contentStart = literalContentStart(literal)
    const textPosition = query.position - contentStart
    const tokenRef = findConfigTokenRefAt(literal.text, textPosition)
    if (tokenRef && textPosition >= tokenRef.pathStart && textPosition <= tokenRef.pathEnd) {
      const prefix = literal.text.slice(tokenRef.pathStart, textPosition)
      return completeConfigTokenPath(prefix, context.specIndex).map((name) => ({ name, kind: 'token' }))
    }
  }

  const prefix = literal ? query.source.slice(literalContentStart(literal), query.position) : ''

  const cursorInfo = getStyleObjectCursorInfo(sourceFile, query.position)
  if (cursorInfo) {
    return completeConfigStyleObject({ ...cursorInfo, prefix }, context.specIndex)
  }

  const semanticTokenCursorInfo = getSemanticTokenCursorInfo(sourceFile, query.position)
  if (semanticTokenCursorInfo) {
    return completeSemanticTokenObject({ ...semanticTokenCursorInfo, prefix }, context.specIndex)
  }

  return []
}

export function getHover(query: DocumentQuery, context: LanguageServiceContext): HoverInfo | null {
  const sourceFile = query.sourceFile ?? ts.createSourceFile(query.fileName, query.source, ts.ScriptTarget.Latest, true)
  const literal = findEnclosingStringLiteral(sourceFile, query.position)
  if (!literal) return null

  const contentStart = literalContentStart(literal)
  const tokenRef = findConfigTokenRefAt(literal.text, query.position - contentStart)
  if (!tokenRef) return null

  const value = context.specIndex.resolveTokenValue(tokenRef.path)
  if (value === undefined) return null

  return {
    text: `${tokenRef.path}\n${value}`,
    start: contentStart + tokenRef.start,
    end: contentStart + tokenRef.end,
  }
}

export function resolveModule(specifier: string, context: LanguageServiceContext): string | undefined {
  return resolveModuleTarget(specifier, context.importMap, { outdir: context.outdir })
}
