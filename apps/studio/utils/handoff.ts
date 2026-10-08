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

const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/;

export function readWatchMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  parent: unknown,
): string | null {
  if (event.source !== parent || !LOOPBACK.test(event.origin)) return null;
  const { type, json } = event.data ?? {};
  return type === "panda-studio:spec" && typeof json === "string" ? json : null;
}
