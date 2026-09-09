const DB_NAME = "panda-spec-studio";
const STORE = "kv";
const KEY = "tokens";
const KEY_CSS = "tokenCss";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => request.result.createObjectStore(STORE));
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  return await new Promise<T>((resolve, reject) => {
    const request = operation(database.transaction(STORE, mode).objectStore(STORE));
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

export async function saveTokens(raw: string): Promise<void> {
  try {
    await withStore("readwrite", (store) => store.put(raw, KEY));
  } catch {
    return;
  }
}

export async function loadTokens(): Promise<string | null> {
  try {
    return (await withStore<string | undefined>("readonly", (store) => store.get(KEY))) ?? null;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await withStore("readwrite", (store) => store.delete(KEY));
    await withStore("readwrite", (store) => store.delete(KEY_CSS));
  } catch {
    return;
  }
}

export async function saveTokenCss(css: string | null): Promise<void> {
  try {
    await withStore("readwrite", (store) =>
      css ? store.put(css, KEY_CSS) : store.delete(KEY_CSS),
    );
  } catch {
    return;
  }
}

export async function loadTokenCss(): Promise<string | null> {
  try {
    return (await withStore<string | undefined>("readonly", (store) => store.get(KEY_CSS))) ?? null;
  } catch {
    return null;
  }
}
