import { filesize } from 'filesize'
import zlib from 'zlib'

function gzipSizeSync(code: string | Buffer) {
  const zip = zlib.gzipSync(code, { level: zlib.constants.Z_BEST_COMPRESSION })
  return zip.length
}

export function getFileSize(code: string) {
  return filesize(Buffer.byteLength(code, 'utf-8'))
}

export function getZipFileSize(code: string | Buffer) {
  return filesize(gzipSizeSync(code))
}
