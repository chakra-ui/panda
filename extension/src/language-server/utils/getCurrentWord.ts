import { TextDocument } from 'vscode-languageserver-textdocument'

export function getCurrentWord (document: TextDocument, offset: number): string {
  let left = offset - 1
  let right = offset + 1
  const text = document.getText()

  while (left >= 0 && !' \t\n\r":{[()]},*>+'.includes(text.charAt(left))) {
    left--
  }

  while (
    right <= text.length &&
    !' \t\n\r":{[()]},*>+'.includes(text.charAt(right))
  ) {
    right++
  }

  return text.substring(left, right)
}
