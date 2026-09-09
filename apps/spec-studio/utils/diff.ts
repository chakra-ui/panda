import type { TokensFile, Token } from "~/utils/tokens";

export type TokenChange = { name: string; from: string; to: string };
export type CategoryDiff = {
  type: string;
  added: Token[];
  removed: Token[];
  changed: TokenChange[];
};

function byName(values: Token[]): Map<string, string> {
  return new Map(values.map((t) => [t.name, t.value]));
}

// Compare two token models by category → token name. Categories present in
// only one side surface as fully added/removed. Order-independent.
export function diffSpecs(before: TokensFile, after: TokensFile): CategoryDiff[] {
  const a = new Map(before.data.map((c) => [c.type, byName(c.values)]));
  const b = new Map(after.data.map((c) => [c.type, byName(c.values)]));
  const types = [...new Set([...a.keys(), ...b.keys()])].sort();

  const diffs: CategoryDiff[] = [];
  for (const type of types) {
    const prev = a.get(type) ?? new Map();
    const next = b.get(type) ?? new Map();
    const added: Token[] = [];
    const removed: Token[] = [];
    const changed: TokenChange[] = [];

    for (const [name, value] of next) {
      if (!prev.has(name)) added.push({ name, value });
      else if (prev.get(name) !== value) changed.push({ name, from: prev.get(name)!, to: value });
    }
    for (const [name, value] of prev) if (!next.has(name)) removed.push({ name, value });

    if (added.length || removed.length || changed.length) diffs.push({ type, added, removed, changed });
  }
  return diffs;
}
