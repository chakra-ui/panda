import { TextDocument, Position } from 'vscode-languageserver-textdocument'
import { getCurrentLine } from './getCurrentLine'
import { isInFunctionExpression } from './isInFunctionExpression'
import { isInString } from './isInString'

/**
 * Get the context of the current cursor position.
 *
 * Useful for completions
 */
export function getCursorContext(doc: TextDocument, position: Position) {
  const currentLine = getCurrentLine(doc, position)

  const isTokenFunctionCall = currentLine ? isInFunctionExpression(currentLine.text, position) : false
  const isInStringExpression = currentLine ? isInString(currentLine.text, position) : false

  return {
    position,
    currentLine,
    isTokenFunctionCall,
    isInStringExpression,
  }
}
