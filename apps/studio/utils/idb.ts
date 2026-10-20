const DB_NAME = 'panda-spec-studio'
const STORE = 'kv'
const KEY = 'tokens'
const KEY_USAGE = 'scan'
const KEY_FOLDER = 'scanFolder'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.addEventListener('upgradeneeded', () => request.result.createObjectStore(STORE))
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const database = await openDatabase()
  return await new Promise<T>((resolve, reject) => {
    const request = operation(database.transaction(STORE, mode).objectStore(STORE))
    request.addEventListener('success', () => resolve(request.result as T))
    request.addEventListener('error', () => reject(request.error))
  })
}

export async function saveTokens(raw: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.put(raw, KEY))
  } catch {
    return
  }
}

export async function loadTokens(): Promise<string | null> {
  try {
    return (await withStore<string | undefined>('readonly', (store) => store.get(KEY))) ?? null
  } catch {
    return null
  }
}

export async function saveUsage(usage: unknown): Promise<void> {
  try {
    await withStore('readwrite', (store) => (usage ? store.put(usage, KEY_USAGE) : store.delete(KEY_USAGE)))
  } catch {
    return
  }
}

export async function loadUsage<T = unknown>(): Promise<T | null> {
  try {
    return (await withStore<T | undefined>('readonly', (store) => store.get(KEY_USAGE))) ?? null
  } catch {
    return null
  }
}

export async function saveScanFolder(handle: FileSystemDirectoryHandle | null): Promise<void> {
  try {
    await withStore('readwrite', (store) => (handle ? store.put(handle, KEY_FOLDER) : store.delete(KEY_FOLDER)))
  } catch {
    return
  }
}

export async function loadScanFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (
      (await withStore<FileSystemDirectoryHandle | undefined>('readonly', (store) => store.get(KEY_FOLDER))) ?? null
    )
  } catch {
    return null
  }
}
