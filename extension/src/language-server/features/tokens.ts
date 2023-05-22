import { TextDocument } from 'vscode-languageserver-textdocument'
import { defu } from 'defu'
import { parse as parseSfc, SFCStyleBlock } from '@vue/compiler-sfc'
import { pathToVarName, transforms } from 'pinceau/utils'
import { DesignToken } from 'pinceau/index'
import { ColorInformation, Position, Range } from 'vscode-languageserver'
import { DocumentTokensData } from '../index'
import PinceauTokensManager, { PinceauVSCodeSettings } from '../manager'
import { findAll } from '../utils/findAll'
import { indexToPosition } from '../utils/indexToPosition'
import { getCurrentLine } from '../utils/getCurrentLine'
import { getHoveredToken, getHoveredTokenFunction } from '../utils/getHoveredToken'
import { findStringRange } from '../utils/findStringRange'

export function setupTokensHelpers (
  tokensManager: PinceauTokensManager
) {
  /**
   * Use the Pinceau transformers to get the style data out of a `css()` tag.
   *
   * This helps in resolving the local tokens of a `css()` function.
   */
  function getStyleData (uri: string, version: number, index: number, styleBlock: SFCStyleBlock) {
    let transformData = {
      version,
      start: styleBlock.loc.start,
      end: styleBlock.loc.end,
      variants: {},
      computedStyles: {},
      localTokens: {}
    }
    try {
      const transformCache = tokensManager.getTransformCache()
      const cachedTransform = transformCache.get(`css${index}`, uri)
      if (cachedTransform?.version === version) {
        transformData = cachedTransform
      } else {
        transforms.transformCssFunction('---', styleBlock.content, transformData.variants, transformData.computedStyles, transformData.localTokens, { $tokens: () => undefined, utils: {} })
        // Tag localTokens with <style> source
        transformData.localTokens = Object.entries(transformData.localTokens as any).reduce((acc, [key, value]: [string, any]) => ({
          ...acc,
          [key]: {
            ...value,
            source: {
              start: styleBlock.loc.start,
              end: styleBlock.loc.end
            }
          }
        }), {})
        tokensManager.getTransformCache().set(uri, `css${index}`, transformData)
      }
    } catch (e) {
    // Mitigate
    }

    return transformData
  }

  /**
   * Get the local component list of local tokens.
   */
  function getDocumentTokensData (
    doc: TextDocument
  ): DocumentTokensData {
    const parsedData = getParsedVueComponent(doc.uri, doc.version, doc.getText())
    const mergedData = (parsedData?.styles || []).reduce(
      (acc, styleTag, index) => defu(getStyleData(doc.uri, doc.version, index, styleTag), acc),
      {}
    )
    return { ...parsedData, ...mergedData } as DocumentTokensData
  }

  /**
   * Returns a parsed Vue component data.
   */
  function getParsedVueComponent (
    uri: string,
    version: number,
    code: string
  ): { version: number, styles: SFCStyleBlock[] } {
    try {
      const transformCache = tokensManager.getTransformCache()
      const cachedTransform = transformCache.get('sfc', uri)
      if (cachedTransform?.version === version) {
        return cachedTransform
      } else {
        const parsed = parseSfc(code)
        const data = { version, styles: parsed?.descriptor?.styles.filter(styleTag => styleTag.lang === 'ts') || [] }
        tokensManager.getTransformCache().set(uri, 'sfc', data)
        return data
      }
    } catch (e) {
      return {
        version,
        styles: []
      }
    }
  }

  /**
 * Get all the tokens from the document and call a callback on it.
 */
  function getDocumentTokens (
    doc: TextDocument,
    tokensData?: DocumentTokensData,
    settings?: PinceauVSCodeSettings,
    onToken?: (token: { match: RegExpMatchArray, tokenPath: string, token: DesignToken, range: Range, localToken?: any, settings: PinceauVSCodeSettings }) => void
  ) {
    const colors: ColorInformation[] = []

    const text = doc.getText()
    const referencesRegex = /{([a-zA-Z0-9.]+)}/g
    const dtRegex = /\$dt\(['|`|"]([a-zA-Z0-9.]+)['|`|"](?:,\s*(['|`|"]([a-zA-Z0-9.]+)['|`|"]))?\)?/g
    const dtMatches = findAll(dtRegex, text)
    const tokenMatches = findAll(referencesRegex, text)

    const globalStart: Position = { line: 0, character: 0 }

    for (const match of [...dtMatches, ...tokenMatches]) {
      const tokenPath = match[1]
      const varName = pathToVarName(tokenPath)
      const start = indexToPosition(text, match.index)
      const end = indexToPosition(text, match.index + tokenPath.length)

      const localToken = tokensData?.localTokens?.[varName]

      const token = tokensManager.getAll().get(tokenPath)

      const range = {
        start: {
          line: globalStart.line + start.line,
          character: (end.line === 0 ? globalStart.character : 0) + start.character
        },
        end: {
          line: globalStart.line + end.line,
          character: (end.line === 0 ? globalStart.character : 0) + end.character
        }
      }

      onToken({
        match,
        tokenPath,
        token,
        localToken,
        range,
        settings
      })
    }

    return colors
  }

  /**
 * Get the closest token starting from a cursor position.
 *
 * Useful for hover/definition.
 */
  function getClosestToken (
    doc: TextDocument,
    position: Position,
    tokensData?: DocumentTokensData
  ) {
    const toRet: {
    delimiter: string
    currentLine?: { text: string, range: { start: number; end: number; } }
    currentToken?: { token: string, range: { start: number; end: number; } }
    closestToken?: any
    token?: any
    localToken?: any
    lineRange?: { start: number, end: number }
  } = {
    delimiter: '{',
    currentToken: undefined,
    currentLine: undefined,
    closestToken: undefined,
    localToken: undefined,
    token: undefined,
    lineRange: undefined
  }

    toRet.currentLine = getCurrentLine(doc, position)
    if (!toRet.currentLine) { return }

    // Try to grab `{}` syntax
    toRet.currentToken = getHoveredToken(doc, position)

    // Try to grab `$dt()` syntax
    if (!toRet.currentToken) {
      toRet.currentToken = getHoveredTokenFunction(doc, position)
      if (toRet.currentToken) { toRet.delimiter = '$dt(' }
    }

    // No syntax found
    if (!toRet.currentToken) { return toRet }

    // Get from local component tokens
    toRet.localToken = tokensData?.localTokens?.[pathToVarName(toRet.currentToken.token)]

    toRet.token = tokensManager.getAll().get(toRet.currentToken.token)

    // Try to resolve from parent token
    if (!toRet.localToken && !toRet?.token?.definitions) {
      let currentTokenPath = toRet.currentToken.token.split('.')
      while (currentTokenPath.length) {
        toRet.currentToken.token = currentTokenPath.join('.')
        toRet.closestToken = tokensManager.getAll().get(toRet.currentToken.token)
        if (toRet.closestToken) { currentTokenPath = [] }
        currentTokenPath = currentTokenPath.splice(1)
      }
    }

    toRet.lineRange = findStringRange(toRet.currentLine.text, toRet.currentToken.token, position, toRet.delimiter)

    return toRet
  }

  return {
    getClosestToken,
    getDocumentTokensData,
    getParsedVueComponent,
    getDocumentTokens,
    getStyleData
  }
}
