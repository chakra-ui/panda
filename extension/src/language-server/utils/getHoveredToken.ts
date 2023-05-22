import { TextDocument, Position } from 'vscode-languageserver-textdocument'
import { getCurrentLine } from './getCurrentLine'
import { dtRegex } from './regexes'

export function getHoveredToken (doc: TextDocument, position: Position): { token: string, range: { start: number, end: number } } | undefined {
  const line = getCurrentLine(doc, position)
  if (!line) { return }
  const startIndex = line.text.lastIndexOf('{', position.character)
  const endIndex = line.text.indexOf('}', position.character)
  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) { return }
  return {
    token: line.text.substring(startIndex + 1, endIndex),
    range: {
      start: line.range.start + startIndex + 1,
      end: line.range.start + (endIndex - startIndex)
    }
  }
}

export function getHoveredTokenFunction (doc: TextDocument, position: Position): { token: string, range: { start: number, end: number } } | undefined {
  const line = getCurrentLine(doc, position)
  if (!line) { return }
  const startIndex = line.text.lastIndexOf('$dt(', position.character)
  let endIndex = line.text.indexOf(')', position.character)
  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) { return }
  endIndex = endIndex + 1
  const matches = dtRegex.exec(line.text.substring(startIndex, endIndex))
  return {
    token: matches?.[1],
    range: {
      start: line.range.start + startIndex,
      end: line.range.start + (endIndex - startIndex)
    }
  }
}
