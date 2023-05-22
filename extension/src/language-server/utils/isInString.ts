import { Position } from 'vscode-languageserver'

export function isInString (text: string, position: Position): boolean {
  const index = position.character
  const quoteStart = text.lastIndexOf("'", index)
  const quoteEnd = text.indexOf("'", index)
  if (quoteStart !== -1 && quoteEnd !== -1 && (quoteStart === quoteEnd || (quoteStart < quoteEnd && quoteStart !== -1))) { return true }
  const backtickStart = text.lastIndexOf('`', index)
  const backtickEnd = text.indexOf('`', index)
  if (backtickStart !== -1 && backtickEnd !== -1 && (backtickStart === backtickEnd || (backtickStart < backtickEnd && backtickStart !== -1))) { return true }
  const doubleQuoteStart = text.lastIndexOf('"', index)
  const doubleQuoteEnd = text.indexOf('"', index)
  if (doubleQuoteEnd !== -1 && doubleQuoteStart !== -1 && (doubleQuoteEnd === doubleQuoteStart || (doubleQuoteEnd < doubleQuoteStart && doubleQuoteEnd !== -1))) { return true }
  return false
}
