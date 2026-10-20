import { onMounted, ref, shallowRef, type Ref } from 'vue'
import { index, parseSpec, type DesignSystemIndex } from '~/utils/design-system'
import { extractSpec } from '~/utils/extract-tokens'
import { loadScanFolder, loadUsage, saveScanFolder, saveTokens, saveUsage } from '~/utils/idb'
import { isSourceFile } from '~/utils/analyze'
import { canRead, canRescan, fromFileList, pickDirectory, readDirectory, type PickedFile } from '~/utils/project-files'
import { attachSources, isUsageReport, scanFromReport, scanSources, type ProjectScan } from '~/utils/project-scan'
import { useFolderDrop } from '~/composables/useFolderDrop'

const paint = () => new Promise((r) => requestAnimationFrame(() => r(null)))

export function useProjectScan(ds: Ref<DesignSystemIndex | null>) {
  const scan = shallowRef<ProjectScan | null>(null)
  const status = ref<'idle' | 'scanning'>('idle')
  const error = ref('')
  const folder = shallowRef<FileSystemDirectoryHandle | null>(null)

  const names = new WeakMap<DesignSystemIndex, Map<string, string[]>>()
  const tokenNames = (category: string) => {
    const system = ds.value
    if (!system) return []
    const byCategory = names.get(system) ?? new Map<string, string[]>()
    names.set(system, byCategory)
    let list = byCategory.get(category)
    if (!list) {
      list = system.view(category).map((t) => t.name)
      byCategory.set(category, list)
    }
    return list
  }

  async function adoptSpec(files: PickedFile[]) {
    const raw = await extractSpec(files.map((f) => f.file))
    const parsed = raw ? parseSpec(raw) : null
    if (raw && parsed?.ok) {
      ds.value = index(parsed.spec)
      await saveTokens(raw)
    }
  }

  async function findReport(files: PickedFile[]) {
    for (const { file } of files) {
      if (!file.name.endsWith('.json') || file.name.endsWith('design-system.json')) continue
      try {
        const json = JSON.parse(await file.text())
        if (isUsageReport(json)) return json
      } catch {
        continue
      }
    }
    return null
  }

  async function run(files: PickedFile[]) {
    error.value = ''
    status.value = 'scanning'
    await paint()
    try {
      await adoptSpec(files)
      const report = await findReport(files)
      const sources = files.filter((f) => isSourceFile(f.path))
      if (!ds.value) {
        error.value =
          'Studio needs your design system to scan against. Open it first, or include styled-system/specs/design-system.json in the folder.'
        return
      }
      if (report && !sources.length) {
        setScan(scanFromReport(report, tokenNames))
        return
      }
      if (!sources.length) {
        error.value =
          'No source files in that folder. Studio skips node_modules/, styled-system/ and build output, so try your app or src folder.'
        return
      }
      const { createCompilerFromSpec } = await import('~/utils/analyze-compiler')
      const compiler = await createCompilerFromSpec(ds.value.spec)
      const texts = await Promise.all(sources.map(async (f) => ({ path: f.path, text: await f.file.text() })))
      setScan(scanSources(compiler, texts, tokenNames))
    } catch (cause) {
      error.value = `The scan stopped: ${cause instanceof Error ? cause.message : String(cause)}. Try again, or scan a smaller folder.`
    } finally {
      status.value = 'idle'
    }
  }

  function setScan(next: ProjectScan) {
    scan.value = next
    saveUsage(next)
  }

  async function scanFolder(handle: FileSystemDirectoryHandle) {
    folder.value = handle
    await saveScanFolder(handle)
    status.value = 'scanning'
    await run(await readDirectory(handle))
  }

  async function choose() {
    const handle = await pickDirectory()
    if (handle) await scanFolder(handle)
  }

  async function rescan() {
    if (folder.value && (await canRead(folder.value, true))) await scanFolder(folder.value)
  }

  const drop = useFolderDrop(async (files) => {
    if (!pendingHandle) return run(fromFileList(files))
    const handle = await pendingHandle
    pendingHandle = null
    if (handle?.kind === 'directory') return scanFolder(handle as FileSystemDirectoryHandle)
    return run(fromFileList(files))
  })

  let pendingHandle: Promise<FileSystemHandle | null> | null = null

  function onDrop(event: DragEvent) {
    const item = event.dataTransfer?.items[0] as
      | (DataTransferItem & { getAsFileSystemHandle?: () => Promise<FileSystemHandle | null> })
      | undefined
    pendingHandle = item?.getAsFileSystemHandle?.() ?? null
    return drop.onDrop(event)
  }

  async function onPick(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    folder.value = null
    await saveScanFolder(null)
    await run(fromFileList(files))
  }

  async function attach(picked?: PickedFile[]) {
    const current = scan.value
    if (!current) return
    let files = picked
    if (!files) {
      const handle = await pickDirectory()
      if (!handle) return
      files = await readDirectory(handle)
    }
    error.value = ''
    const sources = files.filter((f) => isSourceFile(f.path))
    const texts = await Promise.all(sources.map(async (f) => ({ path: f.path, text: await f.file.text() })))
    const next = attachSources(current, texts)
    if (next.files.every((f, i) => f.source === current.files[i].source)) {
      error.value = "None of the report's files are in that folder. Pick the folder you ran panda analyze in."
      return
    }
    setScan(next)
  }

  async function onAttach(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    await attach(fromFileList(files))
  }

  const liveSources = new Map<string, string>()

  async function live(change: { files?: { path: string; text: string }[]; path?: string; text?: string | null }) {
    if (change.files) {
      liveSources.clear()
      for (const f of change.files) liveSources.set(f.path, f.text)
    }
    if (change.path) {
      if (change.text == null) liveSources.delete(change.path)
      else liveSources.set(change.path, change.text)
    }
    if (!ds.value) return
    const { createCompilerFromSpec } = await import('~/utils/analyze-compiler')
    const compiler = await createCompilerFromSpec(ds.value.spec)
    const sources = [...liveSources].filter(([path]) => isSourceFile(path)).map(([path, text]) => ({ path, text }))
    scan.value = { ...scanSources(compiler, sources, tokenNames), origin: 'live' }
  }

  function clear() {
    scan.value = null
    error.value = ''
    saveUsage(null)
  }

  onMounted(async () => {
    const saved = await loadUsage<ProjectScan>()
    if (saved?.files) scan.value = saved
    folder.value = canRescan() ? await loadScanFolder() : null
  })

  return {
    scan,
    status,
    error,
    folder,
    canPickFolder: canRescan,
    choose,
    rescan,
    scanFiles: (files: File[]) => run(fromFileList(files)),
    clear,
    attach,
    live,
    onAttach,
    onPick,
    onDrop,
    dragging: drop.dragging,
    busy: drop.busy,
    onDragOver: drop.onDragOver,
    onDragLeave: drop.onDragLeave,
  }
}
