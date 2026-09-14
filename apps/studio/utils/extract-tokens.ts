import { parseTokenDict } from "./panda-dict";
import { extractTokenLayer } from "./token-css";

const pathOf = (f: File) =>
  (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

const cssRank = (p: string) =>
  p.endsWith("styled-system/styles.css") ? 0 : p.includes("styled-system/") ? 1 : 2;

export async function extractTokens(
  files: File[],
): Promise<{ tokensJson: string | null; css: string | null }> {
  let tokensJson: string | null = null;
  const target =
    files.find((f) => f.name === "tokens.json") ??
    (files.length === 1 && files[0].name.endsWith(".json") ? files[0] : undefined);
  if (target) {
    tokensJson = await target.text();
  } else {
    const dictFile = files.find((f) => /styled-system\/tokens\/index\.(mjs|js)$/.test(pathOf(f)));
    if (dictFile) {
      const parsed = parseTokenDict(await dictFile.text());
      if (parsed) tokensJson = JSON.stringify(parsed);
    }
  }

  const cssCandidates = files
    .filter((f) => f.name.endsWith(".css") && f.size <= 8_000_000)
    .toSorted((a, b) => cssRank(pathOf(a)) - cssRank(pathOf(b)))
    .slice(0, 12);
  let css: string | null = null;
  for (const f of cssCandidates) {
    css = extractTokenLayer(await f.text());
    if (css) break;
  }

  return { tokensJson, css };
}
