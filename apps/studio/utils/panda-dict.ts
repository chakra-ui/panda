import type { TokensFile } from "./tokens";

function extractObjectLiteral(source: string): string | null {
  const start = source.indexOf("const tokens");
  if (start === -1) return null;
  const open = source.indexOf("{", start);
  if (open === -1) return null;
  let depth = 0;
  let inString: string | null = null;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") inString = ch;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(open, i + 1);
  }
  return null;
}

export function parseTokenDict(source: string): TokensFile | null {
  const literal = extractObjectLiteral(source);
  if (!literal) return null;
  let dict: Record<string, unknown>;
  try {
    dict = JSON.parse(literal);
  } catch {
    return null;
  }

  const byCategory = new Map<string, { name: string; value: string }[]>();
  for (const [path, raw] of Object.entries(dict)) {
    const dot = path.indexOf(".");
    if (dot === -1) continue;
    const type = path.slice(0, dot);
    const name = path.slice(dot + 1);
    if (name.includes("colorPalette")) continue;
    const value =
      raw && typeof raw === "object" ? String((raw as { value?: unknown }).value ?? "") : String(raw);
    if (!value) continue;
    const list = byCategory.get(type) ?? [];
    list.push({ name, value });
    byCategory.set(type, list);
  }

  const data = [...byCategory.entries()].map(([type, values]) => ({ type, values }));
  return data.length ? { data } : null;
}
