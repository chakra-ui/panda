import { URI } from 'vscode-uri'

const RE_PATHSEP_WINDOWS = /\\/g

/**
 * Returns an fs path the uri of a TextDocument.
 */
export function uriToPath (stringUri: string): string | undefined {
  const uri = URI.parse(stringUri)
  if (uri.scheme !== 'file') { return undefined }
  return normalizeFsPath(uri.fsPath)
}

/**
 * Normalizes the file system path.
 *
 * On systems other than Windows it should be an no-op.
 *
 * On Windows, an input path in a format like "C:/path/file.ts"
 * will be normalized to "c:/path/file.ts".
 */
export function normalizePath (filePath: string): string {
  const fsPath = URI.file(filePath).fsPath
  return normalizeFsPath(fsPath)
}

/**
 * Normalizes the path obtained through the "fsPath" property of the URI module.
 */
export function normalizeFsPath (fsPath: string): string {
  return fsPath.replace(RE_PATHSEP_WINDOWS, '/')
}
