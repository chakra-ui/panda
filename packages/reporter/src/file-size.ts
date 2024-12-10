import { filesize } from 'filesize'
import pako from 'pako'

export function getFileSize(code: string) {
  return filesize(Buffer.byteLength(code, 'utf-8'))
}

export function getZipFileSize(code: string | Buffer) {
  const compressed = pako.gzip(code)
  return filesize(Buffer.byteLength(compressed, 'utf-8'))
}
