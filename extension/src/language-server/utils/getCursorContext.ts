import { SFCStyleBlock } from '@vue/compiler-sfc'
import { TextDocument, Position } from 'vscode-languageserver-textdocument'
import { getCurrentLine } from './getCurrentLine'
import { isInFunctionExpression } from './isInFunctionExpression'
import { isInString } from './isInString'

/**
 * Get the context of the current cursor position.
 *
 * Useful for completions
 */
export function getCursorContext (doc: TextDocument, position: Position, styles: SFCStyleBlock[] = []) {
  const offset = doc.offsetAt(position)
  const currentLine = getCurrentLine(doc, position)

  const isTokenFunctionCall = currentLine ? isInFunctionExpression(currentLine.text, position) : false
  const currentStyleTag = styles.find(styleBlock => (offset >= styleBlock.loc.start.offset && offset <= styleBlock.loc.end.offset))
  const isInStringExpression = currentLine ? isInString(currentLine.text, position) : false

  return {
    position,
    currentLine,
    isTokenFunctionCall,
    isOffsetOnStyleTsTag: !!currentStyleTag,
    isInStringExpression
  }
}
