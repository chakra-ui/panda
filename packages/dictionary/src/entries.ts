type ObjectEntries<T> = {
  [K in keyof T]: { type: K; values: T[K] };
}[keyof T][];

export function* objectEntries<T>(obj: T): IterableIterator<ObjectEntries<T>[number]> {
  for (const key in obj) {
    yield { type: key, values: obj[key] };
  }
}
