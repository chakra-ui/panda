import type { TokensFile } from "~/utils/tokens";

export interface TokenUse {
  name: string;
  uses: number;
}
export interface CategoryUsage {
  type: string;
  total: number;
  used: number;
  unused: number;
  percent: number;
  tokens: TokenUse[];
}
export interface Source {
  name: string;
  text: string;
}

export const SOURCE_EXT = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".vue",
  ".astro",
  ".svelte",
  ".mdx",
  ".css",
];

export function isSourceFile(name: string): boolean {
  return SOURCE_EXT.some((e) => name.endsWith(e));
}

const IGNORED_DIR =
  /(^|\/)(node_modules|\.git|styled-system|dist|build|out|\.next|\.nuxt|\.output|\.turbo|\.vercel|\.svelte-kit|\.astro|coverage|\.cache)(\/|$)/;

export const MAX_FILE_BYTES = 1_500_000;
export const MAX_FILES = 6000;

export function isIgnoredPath(path: string): boolean {
  return IGNORED_DIR.test(path);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function analyzeUsage(file: TokensFile, sources: Source[]): CategoryUsage[] {
  return file.data.map((cat) => {
    const tokens: TokenUse[] = cat.values
      .map((t) => {
        const re = new RegExp(`(?<![\\w-])${escapeRegExp(t.name)}(?![\\w-])`, "g");
        let uses = 0;
        for (const s of sources) uses += s.text.match(re)?.length ?? 0;
        return { name: t.name, uses };
      })
      .toSorted((a, b) => b.uses - a.uses);
    const used = tokens.filter((t) => t.uses > 0).length;
    const total = tokens.length;
    return {
      type: cat.type,
      total,
      used,
      unused: total - used,
      percent: total ? Math.round((used / total) * 100) : 0,
      tokens,
    };
  });
}
