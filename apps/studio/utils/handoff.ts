import { decodeSpec } from "@pandacss/compiler-shared";

export function readHandoff(location: { hash: string }): string | null {
  return new URLSearchParams(location.hash.slice(1)).get("spec");
}

export async function receiveHandoff(encoded: string): Promise<string | null> {
  try {
    return await decodeSpec(encoded);
  } catch {
    return null;
  }
}
