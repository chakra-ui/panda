import lineColumn from 'line-column'
import { Position } from 'vscode-languageserver-textdocument'

export function indexToPosition (str: string, index: number): Position {
  const data = lineColumn(str + '\n', index)
  if (!data) { return { line: 0, character: 0 } }
  const { line, col } = data
  return { line: line - 1, character: col - 1 }
}
