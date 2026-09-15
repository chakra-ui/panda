const pathOf = (f: File) =>
  (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

const rank = (p: string) =>
  p.endsWith("specs/design-system.json") ? 0 : p.endsWith("design-system.json") ? 1 : 2;

/** Find the generated design-system document in a dropped file or folder. */
export async function extractSpec(files: File[]): Promise<string | null> {
  const candidates = files
    .filter((f) => f.name.endsWith(".json"))
    .toSorted((a, b) => rank(pathOf(a)) - rank(pathOf(b)));

  const named = candidates.find((f) => rank(pathOf(f)) < 2);
  if (named) return named.text();
  // A lone JSON file is worth trying: the user may have renamed it.
  return files.length === 1 && candidates.length === 1 ? candidates[0]!.text() : null;
}
