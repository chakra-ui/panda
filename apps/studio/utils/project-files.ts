import { isIgnoredPath, isSourceFile, MAX_FILE_BYTES, MAX_FILES } from './analyze'

export interface PickedFile {
  path: string
  file: File
}

type DirectoryHandle = FileSystemDirectoryHandle & {
  values: () => AsyncIterable<FileSystemDirectoryHandle | FileSystemFileHandle>
  queryPermission: (options: { mode: 'read' }) => Promise<PermissionState>
  requestPermission: (options: { mode: 'read' }) => Promise<PermissionState>
}

export const canRescan = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await (
      window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
    ).showDirectoryPicker()
  } catch {
    return null
  }
}

export async function canRead(handle: FileSystemDirectoryHandle, prompt: boolean): Promise<boolean> {
  const dir = handle as DirectoryHandle
  if ((await dir.queryPermission({ mode: 'read' })) === 'granted') return true
  return prompt && (await dir.requestPermission({ mode: 'read' })) === 'granted'
}

export async function readDirectory(handle: FileSystemDirectoryHandle): Promise<PickedFile[]> {
  const out: PickedFile[] = []
  const walk = async (dir: DirectoryHandle, prefix: string) => {
    for await (const entry of dir.values()) {
      if (out.length >= MAX_FILES) return
      const path = `${prefix}${entry.name}`
      if (entry.kind === 'directory') {
        if (!isIgnoredPath(`${path}/`)) await walk(entry as DirectoryHandle, `${path}/`)
      } else if (keep(path)) {
        const file = await (entry as FileSystemFileHandle).getFile()
        if (file.size <= MAX_FILE_BYTES) out.push({ path, file })
      }
    }
  }
  await walk(handle as DirectoryHandle, `${handle.name}/`)
  return out
}

const keep = (path: string) => !isIgnoredPath(path) && (isSourceFile(path) || path.endsWith('.json'))

const pathOf = (f: File) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name

export const fromFileList = (files: File[]): PickedFile[] =>
  files
    .map((file) => ({ path: pathOf(file), file }))
    .filter((f) => keep(f.path) && f.file.size <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES)
