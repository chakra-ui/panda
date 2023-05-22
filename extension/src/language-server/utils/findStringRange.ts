import { Position } from 'vscode-languageserver'

export function findStringRange (text: string, target: string, position: Position, delimiter = '{'): { start: number, end: number } {
  const toRet = {
    start: -1,
    end: -1
  }

  if (text.includes(target)) {
    const lastIndex = text.lastIndexOf(delimiter, position.character)
    const startIndex = text.indexOf(target, lastIndex)

    if (lastIndex === -1 || startIndex === -1) { return toRet }

    toRet.start = startIndex
    toRet.end = startIndex + target.length
  }

  return toRet
}
