import type { Node } from 'ts-morph'

export const getNodeRange = (node: Node) => {
  const src = node.getSourceFile()
  const [startPosition, endPosition] = [node.getStart(), node.getEnd()]

  const startInfo = src.getLineAndColumnAtPos(startPosition)
  const endInfo = src.getLineAndColumnAtPos(endPosition)

  return {
    startPosition,
    startLineNumber: startInfo.line,
    startColumn: startInfo.column,
    endPosition,
    endLineNumber: endInfo.line,
    endColumn: endInfo.column,
  }
}

export type NodeRange = ReturnType<typeof getNodeRange>
