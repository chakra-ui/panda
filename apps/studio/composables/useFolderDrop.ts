import { ref } from "vue";

const PRUNE = /(^|\/)(node_modules|\.git|dist|\.next|\.nuxt|\.output|coverage)(\/|$)/;
const MAX_COLLECT = 20000;

export const shouldPrune = (path: string) => PRUNE.test(path);

type FileEntry = {
  isFile: boolean;
  isDirectory: boolean;
  fullPath: string;
  file: (cb: (f: File) => void) => void;
  createReader: () => { readEntries: (cb: (e: FileEntry[]) => void, err: (e: unknown) => void) => void };
};

function withPath(file: File, path: string): File {
  Object.defineProperty(file, "webkitRelativePath", { value: path, configurable: true });
  return file;
}

function readAll(reader: ReturnType<FileEntry["createReader"]>): Promise<FileEntry[]> {
  const out: FileEntry[] = [];
  return new Promise((resolve, reject) => {
    const pump = () =>
      reader.readEntries((batch) => {
        if (!batch.length) return resolve(out);
        out.push(...batch);
        pump();
      }, reject);
    pump();
  });
}

async function walk(entry: FileEntry, sink: File[]): Promise<void> {
  if (sink.length >= MAX_COLLECT) return;
  const path = entry.fullPath.replace(/^\//, "");
  if (PRUNE.test(path)) return;
  if (entry.isFile) {
    await new Promise<void>((resolve) =>
      entry.file((f) => {
        sink.push(withPath(f, path));
        resolve();
      }),
    );
    return;
  }
  if (entry.isDirectory) {
    const children = await readAll(entry.createReader());
    for (const child of children) await walk(child, sink);
  }
}

const paint = () => new Promise((r) => requestAnimationFrame(() => r(null)));

export function useFolderDrop(onFiles: (files: File[]) => void | Promise<void>) {
  const dragging = ref(false);
  const busy = ref(false);

  async function run(collect: () => Promise<File[]>) {
    busy.value = true;
    await paint();
    try {
      await onFiles(await collect());
    } finally {
      busy.value = false;
    }
  }

  async function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging.value = false;
    const items = event.dataTransfer?.items;
    const entries = items
      ? Array.from(items)
          .map((i) => (i.webkitGetAsEntry?.() as unknown as FileEntry | null) ?? null)
          .filter((e): e is FileEntry => !!e)
      : [];
    const files = Array.from(event.dataTransfer?.files ?? []);
    await run(async () => {
      if (entries.length) {
        const sink: File[] = [];
        for (const entry of entries) await walk(entry, sink);
        return sink;
      }
      return Array.from(files).filter((f) => !PRUNE.test(f.webkitRelativePath || f.name));
    });
  }

  async function onPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    await run(async () => {
      const out = files.filter((f) => !PRUNE.test(f.webkitRelativePath || f.name));
      input.value = "";
      return out;
    });
  }

  return {
    dragging,
    busy,
    onPick,
    onDrop,
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      dragging.value = true;
    },
    onDragLeave: () => (dragging.value = false),
  };
}
