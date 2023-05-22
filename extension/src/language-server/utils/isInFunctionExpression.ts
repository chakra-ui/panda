import { Position } from 'vscode-languageserver'

export function isInFunctionExpression (line: string, position: Position): boolean {
  const index = position.character
  const charBefore = line[index - 3] + line[index - 2] + line[index - 1] + line[index]
  if (charBefore === '$dt(') { return true }
  return false
}
