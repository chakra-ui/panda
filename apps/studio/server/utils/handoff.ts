import { nanoid } from "nanoid";

export type Redis = (command: (string | number)[]) => Promise<unknown>;
export interface Sealed {
  iv: string;
  data: string;
}

export const HANDOFF_TTL_SECONDS = 120;
export const MAX_HANDOFF_DATA = 4_000_000;

const BASE64URL = /^[\w-]+$/;
const ID = /^[\w-]{16}$/;

export function parseSealed(body: unknown): Sealed | "invalid" | "too-large" {
  if (!body || typeof body !== "object") return "invalid";
  const { iv, data } = body as Record<string, unknown>;
  if (typeof iv !== "string" || typeof data !== "string") return "invalid";
  if (data.length > MAX_HANDOFF_DATA) return "too-large";
  if (!BASE64URL.test(iv) || !BASE64URL.test(data)) return "invalid";
  return { iv, data };
}

export async function putHandoff(redis: Redis, sealed: Sealed): Promise<string> {
  const id = nanoid(16);
  await redis(["SET", `handoff:${id}`, JSON.stringify(sealed), "EX", HANDOFF_TTL_SECONDS]);
  return id;
}

export async function takeHandoff(redis: Redis, id: string): Promise<Sealed | null> {
  if (!ID.test(id)) return null;
  const value = await redis(["GETDEL", `handoff:${id}`]);
  return typeof value === "string" ? (JSON.parse(value) as Sealed) : null;
}

export function memoryRedis(now: () => number = Date.now): Redis {
  const store = new Map<string, { value: string; expires: number }>();
  return async ([command, key, value, , seconds]) => {
    if (command === "SET") {
      store.set(String(key), { value: String(value), expires: now() + Number(seconds) * 1000 });
      return "OK";
    }
    const entry = store.get(String(key));
    store.delete(String(key));
    return entry && entry.expires > now() ? entry.value : null;
  };
}
