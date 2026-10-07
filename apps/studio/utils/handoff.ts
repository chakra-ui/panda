import { openSpec, type SealedSpec } from "@pandacss/compiler-shared";

export function readHandoff(location: { search: string; hash: string }): { id: string; key: string } | null {
  const id = new URLSearchParams(location.search).get("h");
  const key = new URLSearchParams(location.hash.slice(1)).get("k");
  return id && key ? { id, key } : null;
}

export async function receiveHandoff(id: string, key: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  const res = await fetcher(`/api/handoff/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const sealed = (await res.json()) as SealedSpec;
  return openSpec(sealed, key).catch(() => null);
}
