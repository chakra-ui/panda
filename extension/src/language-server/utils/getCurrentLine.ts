import { Position, TextDocument } from 'vscode-languageserver-textdocument'

export function getCurrentLine (document: TextDocument, position: Position): { text: string, range: { start: number, end: number } } {
  const text = document.getText()
  const lines = text.split('\n')
  const line = lines[position.line]
  const lineStart = text.indexOf(line)
  const lineEnd = lineStart + line.length
  return { text: line, range: { start: lineStart, end: lineEnd } }
}
